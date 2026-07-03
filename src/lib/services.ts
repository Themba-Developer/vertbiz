export type Service = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  payfastUrl: string;
  features: string[];
  primary?: boolean;
  hasIntakeForm?: boolean;
  requiresProposedNames?: boolean;
  requiredDocuments?: string[];
};

export const SERVICES: Service[] = [
  {
    id: "cipc",
    name: "Company Registration (CIPC)",
    tagline: "Register your Pty (Ltd) with CIPC",
    price: 749.99,
    priceLabel: "R749.99",
    payfastUrl: "https://payf.st/ox9ab",
    hasIntakeForm: true,
    primary: true,
    requiresProposedNames: true,
    requiredDocuments: ["director_id_copies", "cor14_3"],
    features: [
      "CIPC name reservation",
      "Registration certificate (COR14.3)",
      "MOI lodgement (COR15.1A)",
      "SARS income tax registration",
      "Digital delivery of all documents",
    ],
  },
  {
    id: "csd",
    name: "Central Supplier Database (CSD)",
    tagline: "Get CSD-registered to trade with government",
    price: 349.99,
    priceLabel: "R349.99",
    payfastUrl: "https://payf.st/jalzc",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: ["Full CSD profile setup", "MAAA supplier number", "Ready to bid on tenders"],
  },
  {
    id: "sars-pin",
    name: "SARS Tax Compliance PIN",
    tagline: "Prove your tax status in minutes",
    price: 199,
    priceLabel: "R199",
    payfastUrl: "https://payf.st/w73bz",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: ["Official Tax Compliance Status PIN", "Delivered digitally", "Required for tenders & contracts"],
  },
  {
    id: "bbbee",
    name: "B-BBEE Affidavit",
    tagline: "EME sworn affidavit certificate",
    price: 249.99,
    priceLabel: "R249.99",
    payfastUrl: "https://payf.st/bjv5s",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: ["Signed & commissioned affidavit", "For EMEs under R10m turnover", "Valid for 12 months"],
  },
  {
    id: "sars-pbo",
    name: "SARS PBO Registration",
    tagline: "Public Benefit Organisation status",
    price: 2999,
    priceLabel: "R2,999",
    payfastUrl: "https://payf.st/i15j4",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: ["PBO application to SARS", "Section 18A eligibility", "Tax exemption benefits"],
  },
  {
    id: "company-profile",
    name: "Company Profile",
    tagline: "Professionally designed profile document",
    price: 249,
    priceLabel: "R249",
    payfastUrl: "https://payf.st/4nhbq",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: ["Custom-designed PDF profile", "Editable brand template", "Ready for proposals & tenders"],
  },
  {
    id: "business-plan",
    name: "Business Plan",
    tagline: "Investor & bank-ready business plan",
    price: 2499,
    priceLabel: "R2,499",
    payfastUrl: "https://payf.st/hcg75",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: ["Executive summary & market analysis", "3-year financial projections", "Bank & investor ready format"],
  },
  {
    id: "feasibility",
    name: "Feasibility Study",
    tagline: "In-depth market & financial feasibility",
    price: 16299,
    priceLabel: "R16,299",
    payfastUrl: "https://payf.st/znokr",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    features: [
      "Comprehensive market research",
      "Financial modelling & risk analysis",
      "Detailed written report",
    ],
  },
];

export const getService = (id: string) => SERVICES.find((s) => s.id === id);
