export type Service = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  features: string[];
  primary?: boolean;
  hasIntakeForm?: boolean;
  requiresProposedNames?: boolean;
  requiredDocuments?: string[];
  intakeFields: IntakeField[];
  documents: DocumentRequirement[];
  intakeNotice?: string;
};

export type IntakeField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select";
  required?: boolean;
  helper?: string;
  options?: string[];
};

export type DocumentRequirement = {
  id: string;
  title: string;
  helper: string;
  required: boolean;
  multiple?: boolean;
  requiredWhen?: { fieldId: string; equals: string };
};

const companyBasics: IntakeField[] = [
  { id: "legal_name", label: "Registered legal name", type: "text", required: true },
  { id: "trading_name", label: "Trading name (if different)", type: "text" },
  { id: "registration_number", label: "Company / entity registration number", type: "text", required: true },
  { id: "business_address", label: "Physical business address", type: "textarea", required: true },
];

const SERVICE_TEMPLATES: Service[] = [
  {
    id: "cipc",
    name: "Company Registration (CIPC)",
    tagline: "Register your Pty (Ltd) with CIPC",
    price: 749.99,
    priceLabel: "R749.99",
    hasIntakeForm: true,
    primary: true,
    requiresProposedNames: true,
    requiredDocuments: ["director_id_copies"],
    intakeNotice:
      "Provide every proposed director. Foreign directors may use a valid passport; South African directors must use a 13-digit ID number.",
    intakeFields: [
      { id: "company_activity", label: "Main business activity", type: "textarea", required: true },
      { id: "financial_year_end", label: "Preferred financial year-end month", type: "select", required: true, options: ["February", "March", "June", "September", "December"] },
      { id: "registered_address", label: "Registered office address", type: "textarea", required: true },
    ],
    documents: [
      {
        id: "director_identity",
        title: "Identity document for every director",
        helper: "Upload a clear SA ID (front and back where applicable) or valid passport for each director. Name each file with the director's name.",
        required: true,
        multiple: true,
      },
    ],
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
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice:
      "CSD verifies company, tax, identity and banking information with government and banks. The client must remain available for OTP/account activation; never upload passwords or OTPs.",
    intakeFields: [
      ...companyBasics,
      { id: "income_tax_number", label: "SARS income tax reference number", type: "text", required: true },
      { id: "supplier_type", label: "Supplier type", type: "select", required: true, options: ["Private company", "Sole proprietor", "Non-profit company", "Trust", "Other"] },
      { id: "industry_classification", label: "Industry and main business activity", type: "textarea", required: true },
      { id: "commodities", label: "Goods/services (commodities) to list on CSD", type: "textarea", required: true },
      { id: "delivery_locations", label: "Provinces, municipalities or areas supplied", type: "textarea", required: true },
      { id: "municipality", label: "Business municipality", type: "text", required: true },
      { id: "bank_name", label: "Bank name", type: "text", required: true },
      { id: "account_holder", label: "Bank account holder", type: "text", required: true },
      { id: "account_number", label: "Bank account number", type: "text", required: true },
      { id: "account_type", label: "Bank account type", type: "select", required: true, options: ["Cheque / Current", "Savings", "Transmission"] },
      { id: "branch_code", label: "Bank branch code", type: "text", required: true },
      { id: "bbbee_status", label: "Current B-BBEE evidence", type: "select", required: true, options: ["Valid affidavit", "Valid SANAS certificate", "Not yet available"] },
      { id: "accreditations", label: "Relevant accreditations (CIDB, SETA, professional bodies)", type: "textarea" },
    ],
    documents: [
      { id: "entity_registration", title: "Entity registration/founding document", helper: "CoR14.3 for a company, or the applicable trust/NPO/sole-proprietor document.", required: true },
      { id: "representative_identity", title: "Authorised representative ID/passport", helper: "Clear identity document for the person responsible for this registration.", required: true },
      { id: "bank_confirmation", title: "Bank confirmation letter or statement", helper: "Official document showing legal account holder, account number, type and branch code; preferably not older than 3 months.", required: true },
      { id: "proof_business_address", title: "Proof of business address", helper: "Recent municipal account, lease, bank statement, or other accepted address evidence.", required: true },
      { id: "sars_registration", title: "SARS registration notice", helper: "Document displaying the entity's income tax reference number.", required: true },
      { id: "bbbee_evidence", title: "B-BBEE affidavit or SANAS certificate", helper: "Upload if already available. It can be added to CSD after registration if not yet issued.", required: false },
      { id: "accreditation_evidence", title: "Accreditation certificates", helper: "CIDB, SETA, professional-body or industry certificates, where applicable.", required: false, multiple: true },
    ],
    features: ["Full CSD profile setup", "MAAA supplier number", "Ready to bid on tenders"],
  },
  {
    id: "sars-pin",
    name: "SARS Tax Compliance PIN",
    tagline: "Prove your tax status in minutes",
    price: 199,
    priceLabel: "R199",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice:
      "This service requests a Good Standing TCS PIN. Do not provide an eFiling password or OTP; the client may need to authorise access or participate in verification.",
    intakeFields: [
      ...companyBasics,
      { id: "income_tax_number", label: "Income tax reference number", type: "text", required: true },
      { id: "vat_number", label: "VAT number (if registered)", type: "text" },
      { id: "paye_number", label: "PAYE number (if registered)", type: "text" },
      { id: "efiling_registered", label: "Is the entity active on eFiling?", type: "select", required: true, options: ["Yes", "No", "Unsure"] },
      { id: "known_noncompliance", label: "Known outstanding returns, debt or compliance issues", type: "textarea", required: true },
    ],
    documents: [
      { id: "representative_identity", title: "Authorised representative ID/passport", helper: "Clear identity document for the taxpayer's authorised representative.", required: true },
      { id: "entity_registration", title: "Entity registration/founding document", helper: "CoR14.3 or applicable founding document.", required: true },
      { id: "sars_registration", title: "SARS registration notice", helper: "Document showing the income tax reference number and registered taxpayer name.", required: true },
      { id: "authority_mandate", title: "Signed authority mandate", helper: "Signed authorisation allowing Vert Corp Group to assist with this SARS request.", required: true },
      { id: "sars_correspondence", title: "Relevant SARS correspondence", helper: "Upload compliance notices, statements of account or outstanding-return letters, if applicable.", required: false, multiple: true },
    ],
    features: ["Official Tax Compliance Status PIN", "Delivered digitally", "Required for tenders & contracts"],
  },
  {
    id: "bbbee",
    name: "B-BBEE Affidavit",
    tagline: "EME sworn affidavit certificate",
    price: 249.99,
    priceLabel: "R249.99",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice:
      "The affidavit route is suitable for an EME with turnover of R10 million or less, and for a 51%+ black-owned QSE with turnover up to R50 million. Other QSEs require SANAS verification.",
    intakeFields: [
      ...companyBasics,
      { id: "entity_type", label: "Entity type / applicable sector", type: "text", required: true, helper: "Sector codes may require a different affidavit template." },
      { id: "financial_year_end", label: "Latest financial year-end", type: "date", required: true },
      { id: "annual_turnover", label: "Annual turnover (R)", type: "number", required: true },
      { id: "turnover_basis", label: "Turnover evidence basis", type: "select", required: true, options: ["Annual financial statements", "Management accounts", "New entity / start-up"] },
      { id: "black_ownership", label: "Black ownership (%)", type: "number", required: true },
      { id: "black_women_ownership", label: "Black women ownership (%)", type: "number", required: true },
      { id: "black_youth_ownership", label: "Black youth ownership (%)", type: "number" },
      { id: "black_disabled_ownership", label: "Black people with disabilities ownership (%)", type: "number" },
      { id: "deponent_name", label: "Deponent's full name", type: "text", required: true },
      { id: "deponent_role", label: "Deponent's role", type: "select", required: true, options: ["Director", "Owner", "Member", "Authorised representative"] },
    ],
    documents: [
      { id: "entity_registration", title: "Entity registration/founding document", helper: "Document confirming the exact legal name and registration number.", required: true },
      { id: "deponent_identity", title: "Deponent ID/passport", helper: "Identity document for the authorised person who will swear the affidavit.", required: true },
      { id: "ownership_evidence", title: "Ownership evidence", helper: "Current securities/share register, share certificates, membership schedule, or equivalent ownership record.", required: true, multiple: true },
      { id: "turnover_evidence", title: "Turnover evidence", helper: "Latest signed financial statements or management accounts supporting the declared turnover.", required: true },
      { id: "proof_business_address", title: "Proof of business address", helper: "Recent document confirming the enterprise address used on the affidavit.", required: true },
    ],
    features: ["Signed & commissioned affidavit", "For EMEs under R10m turnover", "Valid for 12 months"],
  },
  {
    id: "sars-pbo",
    name: "SARS PBO Registration",
    tagline: "Public Benefit Organisation status",
    price: 2999,
    priceLabel: "R2,999",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice:
      "SARS tax exemption requires an income-tax-registered entity and evidence matched to its legal form and activities. Section 18A is not automatic and depends on qualifying activities.",
    intakeFields: [
      ...companyBasics,
      { id: "entity_type", label: "Organisation type", type: "select", required: true, options: ["Non-profit company (NPC)", "Trust", "Voluntary association", "Institution/board/body"] },
      { id: "income_tax_number", label: "Income tax reference number", type: "text", required: true },
      { id: "npo_number", label: "NPO / trust / other registration number (where applicable)", type: "text" },
      { id: "formation_date", label: "Organisation formation date", type: "date", required: true },
      { id: "operating_over_12_months", label: "Has the organisation operated for 12 months or more?", type: "select", required: true, options: ["Yes", "No"] },
      { id: "public_benefit_activities", label: "Detailed public benefit activities and beneficiaries", type: "textarea", required: true },
      { id: "activity_locations", label: "Where the activities are carried on", type: "textarea", required: true },
      { id: "section18a_requested", label: "Apply for Section 18A approval?", type: "select", required: true, options: ["Yes", "No", "Need advice"] },
      { id: "registered_representative", label: "Registered representative/public officer", type: "text", required: true },
    ],
    documents: [
      { id: "founding_document", title: "Founding document", helper: "NPC MOI, registered trust instrument, signed constitution, or applicable founding Act.", required: true },
      { id: "registration_proof", title: "Proof of registration", helper: "CIPC, Master of the High Court, DSD/NPO, or other applicable registration proof.", required: true },
      { id: "fiduciary_identities", title: "Certified IDs/passports of fiduciary persons", helper: "Upload clear certified identity documents for all directors, trustees or office bearers (normally at least three).", required: true, multiple: true },
      { id: "bank_confirmation", title: "Proof of organisation bank account", helper: "Stamped/e-stamped bank confirmation letter or statement.", required: true },
      { id: "proof_entity_address", title: "Proof of organisation physical address", helper: "Municipal account, bank statement or completed CRA01 where applicable.", required: true },
      { id: "proof_representative_address", title: "Representative's proof of address", helper: "Required where the registered representative is not already registered with SARS.", required: false },
      { id: "financial_statements", title: "Annual financial statements", helper: "Required when the organisation has operated for 12 months or more.", required: false, requiredWhen: { fieldId: "operating_over_12_months", equals: "Yes" }, multiple: true },
      { id: "activity_evidence", title: "Supporting evidence of public benefit activities", helper: "Programmes, reports, budgets, brochures, agreements or other proof supporting the detailed activity description.", required: true, multiple: true },
      { id: "authority_mandate", title: "Signed authority mandate/resolution", helper: "Resolution authorising the representative and Vert Corp Group to lodge and manage the application.", required: true },
    ],
    features: ["PBO application to SARS", "Section 18A eligibility", "Tax exemption benefits"],
  },
  {
    id: "company-profile",
    name: "Company Profile",
    tagline: "Professionally designed profile document",
    price: 249,
    priceLabel: "R249",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice: "Supply final wording and usable brand assets. The profile will only be as accurate as the business information and evidence provided.",
    intakeFields: [
      ...companyBasics,
      { id: "year_established", label: "Year established", type: "number", required: true },
      { id: "business_overview", label: "Business overview / history", type: "textarea", required: true },
      { id: "mission", label: "Mission", type: "textarea", required: true },
      { id: "vision", label: "Vision", type: "textarea", required: true },
      { id: "products_services", label: "Products and services with short descriptions", type: "textarea", required: true },
      { id: "target_customers", label: "Target customers and service areas", type: "textarea", required: true },
      { id: "competitive_advantage", label: "Why clients should choose the business", type: "textarea", required: true },
      { id: "team_bios", label: "Key team names, roles and short biographies", type: "textarea", required: true },
      { id: "contact_details", label: "Public phone, email, website and social links", type: "textarea", required: true },
      { id: "brand_preferences", label: "Brand colours/style preferences", type: "textarea" },
    ],
    documents: [
      { id: "entity_registration", title: "Company registration document", helper: "Used to verify the legal name and registration number.", required: true },
      { id: "logo", title: "Logo (best available quality)", helper: "Prefer a transparent, high-resolution PNG. PDF/JPG is also accepted.", required: true },
      { id: "portfolio_media", title: "Product, project or workplace images", helper: "Upload original high-quality images with permission to use them.", required: true, multiple: true },
      { id: "certifications", title: "Certificates, licences and accreditations", helper: "Upload only current credentials that should appear in the profile.", required: false, multiple: true },
      { id: "team_photos", title: "Team photographs", helper: "Optional professional photographs corresponding to the supplied team biographies.", required: false, multiple: true },
      { id: "existing_brand_material", title: "Existing brochures or brand guide", helper: "Optional references for design and wording.", required: false, multiple: true },
    ],
    features: ["Custom-designed PDF profile", "Editable brand template", "Ready for proposals & tenders"],
  },
  {
    id: "business-plan",
    name: "Business Plan",
    tagline: "Investor & bank-ready business plan",
    price: 2499,
    priceLabel: "R2,499",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice: "Financial projections depend on evidence and assumptions. State whether this is a start-up, expansion, funding, visa, tender or internal-planning document.",
    intakeFields: [
      ...companyBasics,
      { id: "business_stage", label: "Business stage", type: "select", required: true, options: ["Idea / pre-start", "Start-up trading", "Established business", "Expansion / new division"] },
      { id: "plan_purpose", label: "Purpose and intended reader", type: "textarea", required: true },
      { id: "business_model", label: "Products/services, pricing and revenue model", type: "textarea", required: true },
      { id: "target_market", label: "Target market, geography and customer problem", type: "textarea", required: true },
      { id: "competitors", label: "Known competitors and competitive advantage", type: "textarea", required: true },
      { id: "marketing_sales", label: "Marketing and sales strategy", type: "textarea", required: true },
      { id: "operations", label: "Premises, equipment, suppliers and operating process", type: "textarea", required: true },
      { id: "management", label: "Owners, management experience and staffing plan", type: "textarea", required: true },
      { id: "funding_required", label: "Funding required, use of funds and own contribution", type: "textarea", required: true },
      { id: "financial_assumptions", label: "Sales, costs, salaries and other projection assumptions", type: "textarea", required: true },
      { id: "existing_business", label: "Does the business have trading history?", type: "select", required: true, options: ["Yes", "No"] },
    ],
    documents: [
      { id: "entity_registration", title: "Entity or founder identification", helper: "Existing entity: registration/founding document. Pre-registration start-up: founder identity document.", required: true },
      { id: "founder_cvs", title: "Owner/management CVs", helper: "CVs or biographies showing relevant experience and qualifications.", required: true, multiple: true },
      { id: "financial_history", title: "Historical financial information", helper: "For an existing business: latest financial statements or management accounts and recent bank statements.", required: false, requiredWhen: { fieldId: "existing_business", equals: "Yes" }, multiple: true },
      { id: "quotes", title: "Supplier quotations / equipment estimates", helper: "Evidence supporting major start-up or expansion costs.", required: true, multiple: true },
      { id: "market_evidence", title: "Contracts, orders or market evidence", helper: "Optional letters of intent, purchase orders, research or customer evidence.", required: false, multiple: true },
      { id: "licenses", title: "Licences, permits or industry approvals", helper: "Upload where the proposed activity is regulated.", required: false, multiple: true },
    ],
    features: ["Executive summary & market analysis", "3-year financial projections", "Bank & investor ready format"],
  },
  {
    id: "feasibility",
    name: "Feasibility Study",
    tagline: "In-depth market & financial feasibility",
    price: 16299,
    priceLabel: "R16,299",
    hasIntakeForm: true,
    requiresProposedNames: false,
    requiredDocuments: ["id_copy", "cor14_3"],
    intakeNotice: "A defensible feasibility study needs a defined decision, location, capacity, technical concept and financial assumptions—not only company registration documents.",
    intakeFields: [
      ...companyBasics,
      { id: "decision_question", label: "Project and decision the study must answer", type: "textarea", required: true },
      { id: "project_location", label: "Project/site location and geographic market", type: "textarea", required: true },
      { id: "product_capacity", label: "Product/service and planned capacity", type: "textarea", required: true },
      { id: "target_market", label: "Customers, demand assumptions and route to market", type: "textarea", required: true },
      { id: "technical_scope", label: "Technology, process, equipment and utilities", type: "textarea", required: true },
      { id: "site_status", label: "Site status", type: "select", required: true, options: ["Owned", "Leased", "Under negotiation", "Not yet identified"] },
      { id: "regulatory_requirements", label: "Known licences, zoning, environmental or sector approvals", type: "textarea", required: true },
      { id: "capital_budget", label: "Available capital budget and funding structure", type: "textarea", required: true },
      { id: "timeline", label: "Target implementation date and milestones", type: "textarea", required: true },
      { id: "study_standard", label: "Funder, investor or authority requirements", type: "textarea" },
    ],
    documents: [
      { id: "project_brief", title: "Detailed project brief", helper: "Scope, objectives, capacity, location and the investment decision required.", required: true },
      { id: "site_evidence", title: "Site/land information", helper: "Title deed, lease, offer, maps, layouts, zoning or site photographs, where a site is identified.", required: false, multiple: true },
      { id: "technical_information", title: "Technical specifications and process information", helper: "Designs, equipment lists, production assumptions, utility needs or engineering material.", required: true, multiple: true },
      { id: "supplier_quotes", title: "Capital and operating cost quotations", helper: "Current supplier quotations or credible estimates for major cost items.", required: true, multiple: true },
      { id: "market_research", title: "Existing market/customer evidence", helper: "Studies, contracts, letters of intent, orders, surveys or competitor information.", required: false, multiple: true },
      { id: "financial_information", title: "Financial information and funding terms", helper: "Available budgets, funding offers, historic financials and key assumptions.", required: true, multiple: true },
      { id: "permits", title: "Licences, permits and regulatory correspondence", helper: "Upload all available approvals or correspondence relevant to the project.", required: false, multiple: true },
    ],
    features: [
      "Comprehensive market research",
      "Financial modelling & risk analysis",
      "Detailed written report",
    ],
  },
];

const tieredService = (
  service: Service,
  tier: "Basic" | "Standard" | "Premium",
  price: number,
): Service => ({
  ...service,
  id: `${service.id}-${tier.toLowerCase()}`,
  name: `${service.name} — ${tier}`,
  price,
  priceLabel: `R${price.toLocaleString("en-US")}`,
});

export const SERVICES: Service[] = SERVICE_TEMPLATES.flatMap((service) => {
  if (service.id === "business-plan") {
    return [
      tieredService(service, "Basic", 2499),
      tieredService(service, "Standard", 6299),
      tieredService(service, "Premium", 16399),
    ];
  }
  if (service.id === "feasibility") {
    return [
      tieredService(service, "Basic", 2999),
      tieredService(service, "Standard", 7999),
      tieredService(service, "Premium", 16299),
    ];
  }
  return [service];
});

export const getService = (id: string) => {
  const compatibleId =
    id === "business-plan"
      ? "business-plan-basic"
      : id === "feasibility"
        ? "feasibility-premium"
        : id;
  return SERVICES.find((service) => service.id === compatibleId);
};
