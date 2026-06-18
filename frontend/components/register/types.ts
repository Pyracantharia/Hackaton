import type {
  IdfDepartment,
  RegisterFamilyResponse,
  RegisterMemberRelationship,
  RegisterMemberType,
  SchoolLevel,
  SeniorRelationship,
} from "@/lib/api/types";

export type ParentForm = {
  authProvider: "LOCAL" | "GOOGLE";
  confirmationPassword: string;
  email: string;
  firstName: string;
  googleIdToken?: string;
  googleAvatarUrl?: string | null;
  lastName: string;
  password: string;
  phone: string;
};

export type ChildForm = {
  birthDate: string;
  department: IdfDepartment;
  firstName: string;
  lastName: string;
  schoolLevel: SchoolLevel;
};

export type SeniorForm = {
  birthDate: string;
  department: IdfDepartment;
  firstName: string;
  lastName: string;
  seniorRelationship: SeniorRelationship;
};

export type RegisterMemberForm = {
  birthDate: string;
  department: IdfDepartment;
  firstName: string;
  id: string;
  isHolder: boolean;
  isPayer: boolean;
  lastName: string;
  relationship: RegisterMemberRelationship;
  schoolLevel?: SchoolLevel;
  seniorRelationship?: SeniorRelationship;
  type: RegisterMemberType;
};

export type RolesForm = {
  parentIsLegalRepresentative: boolean;
  parentIsPayer: boolean;
  sameAddress: boolean;
};

export type ConsentsForm = {
  mobilityNews: boolean;
  partnerOffers: boolean;
  serviceAlerts: boolean;
};

export type VerificationForm = {
  emailCode: string;
  smsCode: string;
};

export type RegisterFormState = {
  consents: ConsentsForm;
  members: RegisterMemberForm[];
  parent: ParentForm;
  roles: RolesForm;
  verification: VerificationForm;
};

export type RegisterErrors = Record<string, string>;

export type RegisterResult = RegisterFamilyResponse;

export const schoolLevelLabels: Record<SchoolLevel, string> = {
  PRIMARY: "École primaire",
  COLLEGE: "Collège",
  LYCEE: "Lycée",
  HIGHER_EDUCATION: "Études supérieures",
  OTHER: "Autre",
};

export const departmentLabels: Record<IdfDepartment, string> = {
  "75": "Paris (75)",
  "77": "Seine-et-Marne (77)",
  "78": "Yvelines (78)",
  "91": "Essonne (91)",
  "92": "Hauts-de-Seine (92)",
  "93": "Seine-Saint-Denis (93)",
  "94": "Val-de-Marne (94)",
  "95": "Val-d'Oise (95)",
};

export const seniorRelationshipLabels: Record<SeniorRelationship, string> = {
  PARENT: "Parent",
  GRAND_PARENT: "Grand-parent",
  SPOUSE: "Conjoint",
  CAREGIVER: "Proche aidé",
  OTHER: "Autre",
};
