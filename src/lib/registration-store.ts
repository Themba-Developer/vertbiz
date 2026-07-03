export type Director = {
  id: string;
  fullNames: string;
  surname: string;
  idNumber: string;
  email: string;
  phone: string;
  address: string;
};

export type RegistrationDraft = {
  serviceId?: string;
  directors: Director[];
  proposedNames: [string, string, string, string];
  idCopies: File[];
  proofOfAddress: File[];
  directorIdFiles: File[];
  termsAccepted: boolean;
};

const KEY = "vertcorp-registration-draft";

let sessionFiles: Pick<RegistrationDraft, "idCopies" | "proofOfAddress" | "directorIdFiles"> = {
  idCopies: [],
  proofOfAddress: [],
  directorIdFiles: [],
};

export const emptyDirector = (): Director => ({
  id: crypto.randomUUID(),
  fullNames: "",
  surname: "",
  idNumber: "",
  email: "",
  phone: "",
  address: "",
});

export const emptyRegistration = (): RegistrationDraft => ({
  directors: [emptyDirector()],
  proposedNames: ["", "", "", ""],
  idCopies: [],
  proofOfAddress: [],
  directorIdFiles: [],
  termsAccepted: false,
});

type Persisted = Omit<RegistrationDraft, "idCopies" | "proofOfAddress" | "directorIdFiles">;

export const loadRegistration = (): RegistrationDraft => {
  const withSessionFiles = (draft: RegistrationDraft): RegistrationDraft => ({
    ...draft,
    idCopies: sessionFiles.idCopies,
    proofOfAddress: sessionFiles.proofOfAddress,
    directorIdFiles: sessionFiles.directorIdFiles,
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
  const { idCopies, proofOfAddress, directorIdFiles, ...persist } = data;
  sessionFiles = { idCopies, proofOfAddress, directorIdFiles };
  window.localStorage.setItem(KEY, JSON.stringify(persist));
};

export const clearRegistration = () => {
  if (typeof window === "undefined") return;
  sessionFiles = { idCopies: [], proofOfAddress: [], directorIdFiles: [] };
  window.localStorage.removeItem(KEY);
};

export const REGISTRATION_FEE = 749.99;
export const CIPC_PAYFAST_URL = "https://payf.st/ox9ab";
