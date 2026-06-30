export type Director = {
  id: string;
  fullNames: string;
  surname: string;
  idNumber: string;
  email: string;
  phone: string;
  address: string;
};

export type UploadedFile = {
  name: string;
  size: number;
  type: string;
};

export type RegistrationData = {
  directors: Director[];
  proposedNames: [string, string, string, string];
  idCopies: UploadedFile[];
  proofOfAddress: UploadedFile[];
  termsAccepted: boolean;
  paymentRef?: string;
  submittedAt?: string;
};

const KEY = "cipc-registration";

export const emptyDirector = (): Director => ({
  id: crypto.randomUUID(),
  fullNames: "",
  surname: "",
  idNumber: "",
  email: "",
  phone: "",
  address: "",
});

export const emptyRegistration = (): RegistrationData => ({
  directors: [emptyDirector()],
  proposedNames: ["", "", "", ""],
  idCopies: [],
  proofOfAddress: [],
  termsAccepted: false,
});

export const loadRegistration = (): RegistrationData => {
  if (typeof window === "undefined") return emptyRegistration();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyRegistration();
    return { ...emptyRegistration(), ...JSON.parse(raw) };
  } catch {
    return emptyRegistration();
  }
};

export const saveRegistration = (data: RegistrationData) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
};

export const clearRegistration = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
};

export const REGISTRATION_FEE = 112.5;
export const GOVERNMENT_FEE = 75;
