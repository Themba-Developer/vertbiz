// Client-side draft for the multi-step form. Files are kept in memory during
// the session (they can't be serialized to localStorage), then uploaded to
// Supabase Storage on final submission.

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
  directors: Director[];
  proposedNames: [string, string, string, string];
  idCopies: File[];
  proofOfAddress: File[];
  termsAccepted: boolean;
};

const KEY = "vertcorp-registration-draft";

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
  termsAccepted: false,
});

type Persisted = Omit<RegistrationDraft, "idCopies" | "proofOfAddress">;

export const loadRegistration = (): RegistrationDraft => {
  if (typeof window === "undefined") return emptyRegistration();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyRegistration();
    const parsed: Persisted = JSON.parse(raw);
    return { ...emptyRegistration(), ...parsed, idCopies: [], proofOfAddress: [] };
  } catch {
    return emptyRegistration();
  }
};

export const saveRegistration = (data: RegistrationDraft) => {
  if (typeof window === "undefined") return;
  const { idCopies, proofOfAddress, ...persist } = data;
  void idCopies; void proofOfAddress;
  window.localStorage.setItem(KEY, JSON.stringify(persist));
};

export const clearRegistration = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
};

export const REGISTRATION_FEE = 112.5;
export const GOVERNMENT_FEE = 75;
