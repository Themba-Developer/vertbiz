import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Register Your Company — Vert Corp Group" },
      { name: "description", content: "Complete your company registration online: director details, proposed names, and documents." },
    ],
  }),
  component: RegisterPage,
});

const STEPS: Step[] = [
  { id: 1, label: "Director Details" },
  { id: 2, label: "Company Names" },
  { id: 3, label: "Documents" },
];

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<RegistrationDraft>(emptyRegistration());
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadRegistration());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveRegistration(data);
  }, [data, hydrated]);

  const update = (partial: Partial<RegistrationDraft>) =>
    setData((d) => ({ ...d, ...partial }));

  const validateStep = (): string[] => {
    const errs: string[] = [];
    if (step === 1) {
      data.directors.forEach((d, i) => {
        const idx = i + 1;
        if (!d.fullNames.trim()) errs.push(`Director ${idx}: full names required.`);
        if (!d.surname.trim()) errs.push(`Director ${idx}: surname required.`);
        if (!/^\d{13}$/.test(d.idNumber)) errs.push(`Director ${idx}: SA ID must be 13 digits.`);
        if (!/^\S+@\S+\.\S+$/.test(d.email)) errs.push(`Director ${idx}: valid email required.`);
        if (d.phone.replace(/\D/g, "").length < 9) errs.push(`Director ${idx}: valid phone required.`);
        if (!d.address.trim()) errs.push(`Director ${idx}: physical address required.`);
      });
    }
    if (step === 2) {
      if (!data.proposedNames[0].trim()) errs.push("Preferred company name is required.");
      const filled = data.proposedNames.filter((n) => n.trim().length > 0);
      if (new Set(filled.map((n) => n.toLowerCase())).size !== filled.length) {
        errs.push("Proposed names must be unique.");
      }
    }
    if (step === 3) {
      if (data.idCopies.length === 0) errs.push("At least one certified ID copy is required.");
      if (data.proofOfAddress.length === 0) errs.push("Proof of address is required.");
      if (data.directorIdFiles.length === 0) errs.push("Director's ID upload is required.");
    }
    return errs;
  };

  const next = () => {
    const errs = validateStep();
    setErrors(errs);
    if (errs.length > 0) return;
    if (step < 3) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: "/summary" });
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
            />
          )}
          {step === 2 && (
            <NamesStep
              names={data.proposedNames}
              onChange={(proposedNames) => update({ proposedNames })}
            />
          )}
          {step === 3 && (
            <DocumentsStep
              idCopies={data.idCopies}
              proofOfAddress={data.proofOfAddress}
              directorIdFiles={data.directorIdFiles}
              onChange={(partial) => update(partial)}
            />
          )}

          {errors.length > 0 && (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm">
              <div className="font-semibold mb-1">Please fix the following:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {errors.map((e) => <li key={e}>{e}</li>)}
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
              {step === 3 ? "Review" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function DirectorsStep({ directors, onChange }: { directors: Director[]; onChange: (d: Director[]) => void }) {
  const setOne = (id: string, patch: Partial<Director>) =>
    onChange(directors.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Director details</h2>
      <p className="text-sm text-muted-foreground mt-1">Provide details for each director of the company.</p>
      <div className="mt-6 space-y-6">
        {directors.map((d, i) => (
          <div key={d.id} className="rounded-xl border border-border bg-surface/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-foreground">Director {i + 1}</div>
              {directors.length > 1 && (
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
              <Field label="Full names"><input type="text" value={d.fullNames} onChange={(e) => setOne(d.id, { fullNames: e.target.value })} className={inputCls} placeholder="e.g. Thandiwe Nomsa" /></Field>
              <Field label="Surname"><input type="text" value={d.surname} onChange={(e) => setOne(d.id, { surname: e.target.value })} className={inputCls} placeholder="e.g. Mokoena" /></Field>
              <Field label="South African ID number"><input type="text" inputMode="numeric" maxLength={13} value={d.idNumber} onChange={(e) => setOne(d.id, { idNumber: e.target.value.replace(/\D/g, "") })} className={inputCls} placeholder="13-digit ID" /></Field>
              <Field label="Email address"><input type="email" value={d.email} onChange={(e) => setOne(d.id, { email: e.target.value })} className={inputCls} placeholder="name@email.com" /></Field>
              <Field label="Phone number"><input type="tel" value={d.phone} onChange={(e) => setOne(d.id, { phone: e.target.value })} className={inputCls} placeholder="082 123 4567" /></Field>
              <Field label="Physical address" className="sm:col-span-2"><textarea rows={2} value={d.address} onChange={(e) => setOne(d.id, { address: e.target.value })} className={inputCls} placeholder="Street address, suburb, city" /></Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...directors, emptyDirector()])} className="inline-flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition">
          <Plus className="h-4 w-4" /> Add Another Director
        </button>
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
      <p className="text-sm text-muted-foreground mt-1">We require up to 4 proposed names and submit them in the order you provide.</p>
      <div className="mt-6 space-y-4">
        {labels.map((label, i) => (
          <Field key={label} label={label} required={i === 0}>
            <input type="text" value={names[i]} onChange={(e) => set(i, e.target.value)} className={inputCls} placeholder={i === 0 ? "Your top choice" : "Optional but recommended"} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function DocumentsStep({ idCopies, proofOfAddress, directorIdFiles, onChange }: { idCopies: File[]; proofOfAddress: File[]; directorIdFiles: File[]; onChange: (p: Partial<RegistrationDraft>) => void }) {
  const handleFiles = (files: FileList | null, target: "idCopies" | "proofOfAddress" | "directorIdFiles", current: File[]) => {
    if (!files) return;
    const accepted: File[] = [];
    const errs: string[] = [];
    Array.from(files).forEach((f) => {
      if (!ACCEPTED.includes(f.type)) { errs.push(`${f.name}: unsupported file type`); return; }
      if (f.size > MAX_BYTES) { errs.push(`${f.name}: exceeds 5MB`); return; }
      accepted.push(f);
    });
    if (errs.length) alert(errs.join("\n"));
    onChange({ [target]: [...current, ...accepted] } as Partial<RegistrationDraft>);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Upload documents</h2>
      <p className="text-sm text-muted-foreground mt-1">Files must be PDF, PNG, or JPG and under 5MB each.</p>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <Uploader title="Certified ID Copy of Director(s)" helper="Upload a certified copy for each director. Certification must be within the last 3 months." files={idCopies} onAdd={(fl) => handleFiles(fl, "idCopies", idCopies)} onRemove={(i) => onChange({ idCopies: idCopies.filter((_, idx) => idx !== i) })} />
        <Uploader title="Director's ID (Original or Certified)" helper="Required for all directors. Upload their original SA ID or certified copy." files={directorIdFiles} onAdd={(fl) => handleFiles(fl, "directorIdFiles", directorIdFiles)} onRemove={(i) => onChange({ directorIdFiles: directorIdFiles.filter((_, idx) => idx !== i) })} />
        <Uploader title="Proof of Address" helper="A utility bill or bank statement, not older than 3 months." files={proofOfAddress} onAdd={(fl) => handleFiles(fl, "proofOfAddress", proofOfAddress)} onRemove={(i) => onChange({ proofOfAddress: proofOfAddress.filter((_, idx) => idx !== i) })} />
      </div>
    </div>
  );
}

function Uploader({ title, helper, files, onAdd, onRemove }: { title: string; helper: string; files: File[]; onAdd: (f: FileList | null) => void; onRemove: (i: number) => void }) {
  const id = useMemo(() => `up-${Math.random().toString(36).slice(2, 9)}`, []);
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <div className="font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{helper}</div>
      <label htmlFor={id} className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-8 cursor-pointer hover:bg-secondary transition">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div className="text-sm text-foreground font-medium">Click to upload or drag and drop</div>
        <div className="text-xs text-muted-foreground">PDF, PNG, JPG — max 5MB</div>
        <input id={id} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="sr-only" onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }} />
      </label>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-accent shrink-0" />
                <span className="truncate text-foreground">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
              <button type="button" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive transition" aria-label="Remove file">
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

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={["block", className ?? ""].join(" ")}>
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}{required && <span className="text-destructive ml-0.5">*</span>}</span>
      {children}
    </label>
  );
}
