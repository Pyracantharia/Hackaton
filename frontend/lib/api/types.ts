export type SchoolLevel = "PRIMARY" | "COLLEGE" | "LYCEE" | "HIGHER_EDUCATION" | "OTHER";
export type IdfDepartment = "75" | "77" | "78" | "91" | "92" | "93" | "94" | "95";
export type RegisterMemberType = "YOUNG" | "SENIOR";
export type RegisterMemberRelationship = "CHILD" | "RELATIVE";
export type SeniorRelationship = "PARENT" | "GRAND_PARENT" | "SPOUSE" | "CAREGIVER" | "OTHER";

export type RegisterFamilyMemberPayload = {
  type: RegisterMemberType;
  relationship: RegisterMemberRelationship;
  firstName: string;
  lastName: string;
  birthDate: string;
  department: IdfDepartment;
  schoolLevel?: SchoolLevel;
  seniorRelationship?: SeniorRelationship;
  isHolder: boolean;
  isPayer: boolean;
};

export type AddHouseholdMemberPayload = RegisterFamilyMemberPayload;

export type RegisterFamilyPayload = {
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
  child?: {
    firstName: string;
    lastName: string;
    birthDate: string;
    schoolLevel: SchoolLevel;
    department: IdfDepartment;
  };
  members: RegisterFamilyMemberPayload[];
  roles: {
    parentIsLegalRepresentative: boolean;
    parentIsPayer: boolean;
    sameAddress: boolean;
  };
  consents: {
    serviceAlerts: boolean;
    mobilityNews: boolean;
    partnerOffers: boolean;
  };
  verification: {
    smsCode: string;
    emailCode: string;
  };
};

export type RegisterFamilyResponse = {
  accessToken: string;
  household: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: "SELF" | "CHILD" | "RELATIVE";
    isHolder: boolean;
    isPayer: boolean;
    isLegalRepresentative: boolean;
  }>;
  nextAction: {
    type: "RECOMMEND_PRODUCT";
    label: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "USER" | "EMPLOYEE" | "ADMIN";
  };
};

export type DashboardMemberProfileType = "MANAGER" | "YOUNG" | "SENIOR" | "OTHER";

export type DashboardMemberStatus =
  | "NO_SUBSCRIPTION"
  | "ACTIVE"
  | "TO_RENEW"
  | "RECOMMENDED"
  | "PENDING_DOCUMENT"
  | "BLOCKED"
  | "LOST"
  | "EXPIRED";

export type DashboardNotificationSeverity = "INFO" | "WARNING" | "SUCCESS" | "DANGER";

export type DashboardMember = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: "SELF" | "CHILD" | "RELATIVE";
  relationLabel: string;
  profileType: DashboardMemberProfileType;
  currentProduct: string | null;
  recommendedProduct: string | null;
  status: DashboardMemberStatus;
  nextAction: string;
  payerName: string | null;
  isHolder: boolean;
  isPayer: boolean;
  isLegalRepresentative: boolean;
  isDemoProfile: boolean;
};

export type DashboardNotification = {
  id: string;
  type: "RENEWAL" | "OFFER_RECOMMENDATION" | "SERVICE_INFO" | "SUPPORT_UPDATE";
  severity: DashboardNotificationSeverity;
  title: string;
  message: string;
  memberId: string | null;
  createdAt: string;
};

export type RecentActivityItem = {
  id: string;
  label: string;
  createdAt: string;
};

export type HouseholdDashboardResponse = {
  household: {
    id: string;
    name: string;
  };
  manager: {
    id: string;
    firstName: string;
    lastName: string;
  };
  summary: {
    membersCount: number;
    urgentActionsCount: number;
    renewalsCount: number;
    offersToCheckCount: number;
  };
  members: DashboardMember[];
  notifications: DashboardNotification[];
  recentActivity: RecentActivityItem[];
};

export type MemberDetailAction = {
  label: string;
  href?: string;
  action?: "lost-pass";
  variant: "primary" | "secondary" | "ghost";
};

export type MemberDetailResponse = {
  household: HouseholdDashboardResponse["household"];
  manager: HouseholdDashboardResponse["manager"];
  member: DashboardMember;
  householdRole: string;
  overview: string;
  supportNote: string;
  accessibilityNote: string | null;
  documents: string[];
  actions: MemberDetailAction[];
  alerts: DashboardNotification[];
};

export type LostPassPayload = {
  memberId: string;
  reason: string;
};

export type LostPassResponse = {
  message: string;
  supportCaseId: string;
};

export type FoundPassPayload = {
  passNumber: string;
  foundLocation: string;
  depositedAtDesk: boolean;
};

export type FoundPassResponse = {
  message: string;
  supportCaseId: string;
  passNumberMasked: string;
};
