export type Director = {
  id: string;
  fullNames: string;
  surname: string;
  idNumber: string;
  email: string;
  phone: string;
  address: string;
  identityType: "sa_id" | "passport";
  nationality: string;
};

export type RegistrationDraft = {
  serviceId?: string;
  directors: Director[];
  proposedNames: [string, string, string, string];
  idCopies: File[];
  proofOfAddress: File[];
  directorIdFiles: File[];
  answers: Record<string, string>;
  documentFiles: Record<string, File[]>;
  termsAccepted: boolean;
};

const KEY = "vertcorp-registration-draft";

let sessionFiles: Pick<RegistrationDraft, "idCopies" | "proofOfAddress" | "directorIdFiles" | "documentFiles"> = {
  idCopies: [],
  proofOfAddress: [],
  directorIdFiles: [],
  documentFiles: {},
};

export const emptyDirector = (): Director => ({
  id: crypto.randomUUID(),
  fullNames: "",
  surname: "",
  idNumber: "",
  email: "",
  phone: "",
  address: "",
  identityType: "sa_id",
  nationality: "South Africa",
});

export const emptyRegistration = (): RegistrationDraft => ({
  directors: [emptyDirector()],
  proposedNames: ["", "", "", ""],
  idCopies: [],
  proofOfAddress: [],
  directorIdFiles: [],
  answers: {},
  documentFiles: {},
  termsAccepted: false,
});

type Persisted = Omit<RegistrationDraft, "idCopies" | "proofOfAddress" | "directorIdFiles" | "documentFiles">;

export const loadRegistration = (): RegistrationDraft => {
  const withSessionFiles = (draft: RegistrationDraft): RegistrationDraft => ({
    ...draft,
    directors:
      draft.directors?.length > 0
        ? draft.directors.map((director) => ({ ...emptyDirector(), ...director }))
        : [emptyDirector()],
    idCopies: sessionFiles.idCopies,
    proofOfAddress: sessionFiles.proofOfAddress,
    directorIdFiles: sessionFiles.directorIdFiles,
    documentFiles: sessionFiles.documentFiles,
  });

  if (typeof window === "undefined") return emptyRegistration();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return withSessionFiles(emptyRegistration());
    const parsed: Persisted = JSON.parse(raw);
    return withSessionFiles({ ...emptyRegistration(), ...parsed });
  } catch {
    return withSessionFiles(emptyRegistration());
  }
};

export const saveRegistration = (data: RegistrationDraft) => {
  if (typeof window === "undefined") return;
  const { idCopies, proofOfAddress, directorIdFiles, documentFiles, ...persist } = data;
  sessionFiles = { idCopies, proofOfAddress, directorIdFiles, documentFiles };
  window.localStorage.setItem(KEY, JSON.stringify(persist));
};

export const clearRegistration = () => {
  if (typeof window === "undefined") return;
  sessionFiles = { idCopies: [], proofOfAddress: [], directorIdFiles: [], documentFiles: {} };
  window.localStorage.removeItem(KEY);
};

export const REGISTRATION_FEE = 749.99;
