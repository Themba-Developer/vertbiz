import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Upload, FileText, X, ArrowLeft, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Stepper, type Step } from "@/components/Stepper";
import {
  emptyDirector,
  emptyRegistration,
  loadRegistration,
  saveRegistration,
  type Director,
  type RegistrationDraft,
} from "@/lib/registration-store";
import { useAuth } from "@/lib/auth-context";
import { getService } from "@/lib/services";
import { isSupportedDocument, pickNativeDocuments, usesNativeDocumentPicker } from "@/lib/document-files";

export const Route = createFileRoute("/_authenticated/register")({
  validateSearch: (s: Record<string, unknown>) => ({
    serviceId: typeof s.serviceId === "string" ? s.serviceId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Register Your Company — Vert Corp Group" },
      { name: "description", content: "Complete your company registration online." },
    ],
  }),
  component: RegisterPage,
});

const MAX_BYTES = 5 * 1024 * 1024;
function RegisterPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/register" });
  const { user } = useAuth();
  const [data, setData] = useState<RegistrationDraft>(emptyRegistration());
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // A service must be selected explicitly from the service catalogue.
  const serviceId = search.serviceId || "";
  const service = getService(serviceId);

  useEffect(() => {
    if (!serviceId) {
      setHydrated(true);
      return;
    }
    const loaded = loadRegistration();
    setData(loaded.serviceId && loaded.serviceId !== serviceId ? { ...emptyRegistration(), serviceId } : { ...loaded, serviceId });
    setHydrated(true);
  }, [serviceId]);

  useEffect(() => {
    if (hydrated && serviceId) saveRegistration(data);
  }, [data, hydrated, serviceId]);

  if (!serviceId || !service) {
    return (
      <SiteShell>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <h1 className="text-2xl font-bold text-foreground">Choose a service first</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select the business service you need before starting a new application.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="/#pricing"
                className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                View Services
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </SiteShell>
    );
  }

  const update = (partial: Partial<RegistrationDraft>) =>
    setData((d) => ({ ...d, ...partial }));

  // Build steps dynamically based on service
  const buildSteps = (): Step[] => {
    const steps: Step[] = [{ id: 1, label: service?.id === "cipc" ? "Director Details" : "Applicant Details" }];
    steps.push({ id: 2, label: "Service Information" });
    if (service?.requiresProposedNames) {
      steps.push({ id: 3, label: "Company Names" });
    }
    steps.push({ id: service?.requiresProposedNames ? 4 : 3, label: "Documents" });
    return steps;
  };

  const STEPS = buildSteps();
  const maxStep = STEPS.length;

  const validateStep = (): string[] => {
    const errs: string[] = [];
    if (step === 1) {
      data.directors.forEach((d, i) => {
        const idx = i + 1;
        if (!d.fullNames.trim()) errs.push(`Director ${idx}: full names required.`);
        if (!d.surname.trim()) errs.push(`Director ${idx}: surname required.`);
        if (d.identityType === "sa_id" && !/^\d{13}$/.test(d.idNumber))
          errs.push(`${service?.id === "cipc" ? `Director ${idx}` : "Applicant"}: SA ID must be 13 digits.`);
        if (d.identityType === "passport" && d.idNumber.trim().length < 5)
          errs.push(`${service?.id === "cipc" ? `Director ${idx}` : "Applicant"}: valid passport number required.`);
        if (d.identityType === "passport" && !d.nationality.trim())
          errs.push(`${service?.id === "cipc" ? `Director ${idx}` : "Applicant"}: nationality required.`);
        if (!/^\S+@\S+\.\S+$/.test(d.email)) errs.push(`Director ${idx}: valid email required.`);
        if (d.phone.replace(/\D/g, "").length < 9) errs.push(`Director ${idx}: valid phone required.`);
        if (!d.address.trim()) errs.push(`Director ${idx}: physical address required.`);
      });
    }

    if (step === 2) {
      service?.intakeFields.forEach((field) => {
        if (field.required && !data.answers[field.id]?.trim()) errs.push(`${field.label} is required.`);
      });
    }

    // Only validate proposed names if service requires them
    if (step === 3 && service?.requiresProposedNames) {
      if (!data.proposedNames[0].trim()) errs.push("Preferred company name is required.");
      const filled = data.proposedNames.filter((n) => n.trim().length > 0);
      if (new Set(filled.map((n) => n.toLowerCase())).size !== filled.length) {
        errs.push("Proposed names must be unique.");
      }
    }

    // Documents step
    const docStep = service?.requiresProposedNames ? 4 : 3;
    if (step === docStep) {
      service?.documents.forEach((document) => {
        const conditionApplies =
          !document.requiredWhen || data.answers[document.requiredWhen.fieldId] === document.requiredWhen.equals;
        if ((document.required || document.requiredWhen) && conditionApplies && !(data.documentFiles[document.id]?.length > 0)) {
          errs.push(`Please upload: ${document.title}.`);
        }
      });
      if (service?.id === "cipc" && (data.documentFiles.director_identity?.length ?? 0) < data.directors.length) {
        errs.push("Upload a separate identity document for every listed director.");
      }
    }
    return errs;
  };

  const next = () => {
    const errs = validateStep();
    setErrors(errs);
    if (errs.length > 0) return;

    if (step < maxStep) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: "/summary", search: { serviceId } });
    }
  };

  const back = () => {
    setErrors([]);
    if (step > 1) setStep((s) => s - 1);
    else navigate({ to: "/" });
  };

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Stepper steps={STEPS} current={step} />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-6 sm:p-8">
          {step === 1 && (
            <DirectorsStep
              directors={data.directors}
              onChange={(directors) => update({ directors })}
              isCompanyRegistration={service?.id === "cipc"}
            />
          )}
          {step === 2 && service && (
            <IntakeStep
              service={service}
              answers={data.answers}
              onChange={(id, value) => update({ answers: { ...data.answers, [id]: value } })}
            />
          )}
          {step === 3 && service?.requiresProposedNames && (
            <NamesStep
              names={data.proposedNames}
              onChange={(proposedNames) => update({ proposedNames })}
            />
          )}
          {step === (service?.requiresProposedNames ? 4 : 3) && (
            <DocumentsStep
              serviceId={service?.id}
              answers={data.answers}
              documentFiles={data.documentFiles}
              onChange={(documentFiles) => update({ documentFiles })}
            />
          )}

          {errors.length > 0 && (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm">
              <div className="font-semibold mb-1">Please fix the following:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              {step === maxStep ? "Review" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function DirectorsStep({
  directors,
  onChange,
  isCompanyRegistration,
}: {
  directors: Director[];
  onChange: (d: Director[]) => void;
  isCompanyRegistration: boolean;
}) {
  const setOne = (id: string, patch: Partial<Director>) =>
    onChange(directors.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">
        {isCompanyRegistration ? "Director details" : "Applicant / representative details"}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        {isCompanyRegistration
          ? "Provide the legal details for every proposed director."
          : "Provide the details of the person authorised to instruct us and answer application queries."}
      </p>
      <div className="mt-6 space-y-6">
        {directors.map((d, i) => (
          <div key={d.id} className="rounded-xl border border-border bg-surface/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-foreground">
                {isCompanyRegistration ? `Director ${i + 1}` : "Authorised applicant"}
              </div>
              {isCompanyRegistration && directors.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(directors.filter((x) => x.id !== d.id))}
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full names">
                <input
                  type="text"
                  value={d.fullNames}
                  onChange={(e) => setOne(d.id, { fullNames: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Thandiwe Nomsa"
                />
              </Field>
              <Field label="Surname">
                <input
                  type="text"
                  value={d.surname}
                  onChange={(e) => setOne(d.id, { surname: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Mokoena"
                />
              </Field>
              <Field label="Identity document type">
                <select
                  value={d.identityType}
                  onChange={(e) => setOne(d.id, { identityType: e.target.value as Director["identityType"] })}
                  className={inputCls}
                >
                  <option value="sa_id">South African ID</option>
                  <option value="passport">Passport</option>
                </select>
              </Field>
              <Field label={d.identityType === "sa_id" ? "South African ID number" : "Passport number"}>
                <input
                  type="text"
                  inputMode={d.identityType === "sa_id" ? "numeric" : "text"}
                  maxLength={d.identityType === "sa_id" ? 13 : 30}
                  value={d.idNumber}
                  onChange={(e) =>
                    setOne(d.id, {
                      idNumber: d.identityType === "sa_id" ? e.target.value.replace(/\D/g, "") : e.target.value,
                    })
                  }
                  className={inputCls}
                  placeholder={d.identityType === "sa_id" ? "13-digit ID" : "Passport number"}
                />
              </Field>
              {d.identityType === "passport" && (
                <Field label="Nationality">
                  <input
                    type="text"
                    value={d.nationality}
                    onChange={(e) => setOne(d.id, { nationality: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              )}
              <Field label="Email address">
                <input
                  type="email"
                  value={d.email}
                  onChange={(e) => setOne(d.id, { email: e.target.value })}
                  className={inputCls}
                  placeholder="name@email.com"
                />
              </Field>
              <Field label="Phone number">
                <input
                  type="tel"
                  value={d.phone}
                  onChange={(e) => setOne(d.id, { phone: e.target.value })}
                  className={inputCls}
                  placeholder="082 123 4567"
                />
              </Field>
              <Field label="Physical address" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={d.address}
                  onChange={(e) => setOne(d.id, { address: e.target.value })}
                  className={inputCls}
                  placeholder="Street address, suburb, city"
                />
              </Field>
            </div>
          </div>
        ))}
        {isCompanyRegistration && (
          <button
            type="button"
            onClick={() => onChange([...directors, emptyDirector()])}
            className="inline-flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition"
          >
            <Plus className="h-4 w-4" /> Add Another Director
          </button>
        )}
      </div>
    </div>
  );
}

function IntakeStep({
  service,
  answers,
  onChange,
}: {
  service: NonNullable<ReturnType<typeof getService>>;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">{service.name} information</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Complete every applicable field so our team can process the service without requesting basic information later.
      </p>
      {service.intakeNotice && (
        <div className="mt-4 rounded-md border border-accent/30 bg-accent/5 p-3 text-sm text-foreground">
          {service.intakeNotice}
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {service.intakeFields.map((field) => (
          <Field
            key={field.id}
            label={field.label}
            required={field.required}
            className={field.type === "textarea" ? "sm:col-span-2" : undefined}
          >
            {field.type === "textarea" ? (
              <textarea
                rows={4}
                value={answers[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={inputCls}
              />
            ) : field.type === "select" ? (
              <select
                value={answers[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={inputCls}
              >
                <option value="">Select an option</option>
                {field.options?.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input
                type={field.type}
                value={answers[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={inputCls}
              />
            )}
            {field.helper && <span className="mt-1 block text-xs text-muted-foreground">{field.helper}</span>}
          </Field>
        ))}
      </div>
    </div>
  );
}

function NamesStep({ names, onChange }: { names: [string, string, string, string]; onChange: (n: [string, string, string, string]) => void }) {
  const set = (i: number, v: string) => {
    const copy = [...names] as [string, string, string, string];
    copy[i] = v;
    onChange(copy);
  };
  const labels = ["Proposed Name 1 (Preferred)", "Proposed Name 2", "Proposed Name 3", "Proposed Name 4"];
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Proposed company names</h2>
      <p className="text-sm text-muted-foreground mt-1">CIPC requires up to 4 proposed names. We submit them in the order you provide.</p>
      <div className="mt-6 space-y-4">
        {labels.map((label, i) => (
          <Field key={label} label={label} required={i === 0}>
            <input
              type="text"
              value={names[i]}
              onChange={(e) => set(i, e.target.value)}
              className={inputCls}
              placeholder={i === 0 ? "Your top choice" : "Optional but recommended"}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

function DocumentsStep({
  serviceId,
  answers,
  documentFiles,
  onChange,
}: {
  serviceId?: string;
  answers: Record<string, string>;
  documentFiles: Record<string, File[]>;
  onChange: (files: Record<string, File[]>) => void;
}) {
  const service = serviceId ? getService(serviceId) : null;

  const handleFiles = (
    files: FileList | File[] | null,
    target: string,
    current: File[]
  ) => {
    if (!files) return;
    const accepted: File[] = [];
    const errs: string[] = [];
    Array.from(files).forEach((f) => {
      if (!isSupportedDocument(f)) {
        errs.push(`${f.name}: unsupported file type`);
        return;
      }
      if (f.size > MAX_BYTES) {
        errs.push(`${f.name}: exceeds 5MB`);
        return;
      }
      accepted.push(f);
    });
    if (errs.length) alert(errs.join("\n"));
    onChange({ ...documentFiles, [target]: [...current, ...accepted] });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Upload documents</h2>
      <p className="text-sm text-muted-foreground mt-1">Files must be PDF, PNG, or JPG and under 5MB each.</p>
      <div className="mt-6 grid grid-cols-1 gap-6">
        {service?.documents
          .filter((document) => !document.requiredWhen || answers[document.requiredWhen.fieldId] === document.requiredWhen.equals)
          .map((document) => {
            const files = documentFiles[document.id] ?? [];
            return (
              <Uploader
                key={document.id}
                title={`${document.title}${document.required || document.requiredWhen ? " *" : " (optional)"}`}
                helper={document.helper}
                files={files}
                multiple={document.multiple}
                onAdd={(fl) => handleFiles(fl, document.id, files)}
                onRemove={(i) => onChange({ ...documentFiles, [document.id]: files.filter((_, idx) => idx !== i) })}
              />
            );
          })}
      </div>
    </div>
  );
}

function Uploader({
  title,
  helper,
  files,
  onAdd,
  onRemove,
  multiple = true,
}: {
  title: string;
  helper: string;
  files: File[];
  onAdd: (f: FileList | File[] | null) => void;
  onRemove: (i: number) => void;
  multiple?: boolean;
}) {
  const nativePicker = usesNativeDocumentPicker();

  const chooseNativeFiles = async () => {
    try {
      onAdd(await pickNativeDocuments(multiple));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The selected file could not be read.";
      if (!/cancel/i.test(message)) alert(message);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <div className="font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{helper}</div>
      <div className="relative mt-4 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-border bg-card px-4 py-8 hover:bg-secondary transition">
        <Upload className="pointer-events-none h-5 w-5 text-muted-foreground" />
        <div className="pointer-events-none text-sm text-foreground font-medium">Tap to choose or upload a file</div>
        <div className="pointer-events-none text-xs text-muted-foreground">PDF, PNG, JPG — max 5MB</div>
        {nativePicker ? (
          <button
            type="button"
            aria-label={`Upload ${title}`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onClick={() => void chooseNativeFiles()}
          >
            Choose file
          </button>
        ) : (
          <input
            type="file"
            multiple={multiple}
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            aria-label={`Upload ${title}`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(e) => {
              onAdd(e.target.files);
              e.target.value = "";
            }}
          />
        )}
      </div>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-accent shrink-0" />
                <span className="truncate text-foreground">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive transition"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={["block", className ?? ""].join(" ")}>
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
