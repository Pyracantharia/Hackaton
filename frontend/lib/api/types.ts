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
  birthDate: string | null;
  schoolLevel: SchoolLevel | null;
  department: IdfDepartment | null;
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
  hasActiveTitle: boolean;
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

export type LostPassReason = "LOST" | "STOLEN" | "DAMAGED" | "UNKNOWN";

export type SupportCaseResolution = "TRANSFER_TO_PHONE" | "DEACTIVATE_ONLY";

export type SupportCaseType = "LOST_PASS" | "FOUND_PASS" | "DOCUMENT_REJECTED" | "PAYMENT_BLOCKED";

export type SupportCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "TRANSFER_TO_PHONE_REQUESTED"
  | "PASS_DEACTIVATION_REQUESTED"
  | "RESOLVED"
  | "CANCELLED_BY_USER";

export type LostPassPayload = {
  memberId: string;
  reason: LostPassReason;
  chosenResolution: SupportCaseResolution;
  understandsDeactivation: boolean;
};

export type LostPassResponse = {
  message: string;
  supportCase: {
    id: string;
    type: SupportCaseType;
    status: SupportCaseStatus;
    dossierNumber: string;
  };
};

export type SupportCaseSummary = {
  id: string;
  dossierNumber: string;
  type: SupportCaseType;
  status: SupportCaseStatus;
  statusLabel: string;
  nextStep: string;
  reason: LostPassReason | null;
  chosenResolution: SupportCaseResolution | null;
  memberId: string | null;
  memberName: string | null;
  titleLabel: string | null;
  passNumberMasked: string | null;
  cancellable: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  resolvedAt: string | null;
};

export type SupportCaseDetail = SupportCaseSummary;

export type SupportCasesListResponse = {
  supportCases: SupportCaseSummary[];
};

export type CancelSupportCaseResponse = {
  message: string;
  supportCase: {
    id: string;
    status: SupportCaseStatus;
  };
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

export type OfferProductType =
  | "NAVIGO_ANNUAL"
  | "IMAGINE_R_JUNIOR"
  | "IMAGINE_R_SCHOOL"
  | "IMAGINE_R_STUDENT"
  | "NAVIGO_SENIOR"
  | "AMETHYSTE"
  | "NAVIGO_LIBERTE"
  | "UNKNOWN";

export type OfferTargetProfile = "CHILD" | "YOUNG" | "STUDENT" | "SENIOR" | "ADULT" | "FAMILY" | "SOLIDARITY";

export type OfferDocumentType =
  | "PHOTO"
  | "SCHOOL_CERTIFICATE"
  | "ID_DOCUMENT"
  | "ADDRESS_PROOF"
  | "SCHOLARSHIP_CERTIFICATE"
  | "SITUATION_PROOF"
  | "PAYMENT_METHOD";

export type OfferRequiredDocument = {
  id: string;
  documentType: OfferDocumentType;
  label: string;
  required: boolean;
};

export type ProductOffer = {
  id: string;
  slug: string;
  name: string;
  productType: OfferProductType;
  shortDescription: string;
  longDescription: string;
  priceLabel: string;
  durationLabel: string;
  targetProfile: OfferTargetProfile;
  minAge: number | null;
  maxAge: number | null;
  benefits: Array<{
    id: string;
    label: string;
  }>;
  requiredDocuments: OfferRequiredDocument[];
};

export type ProductOfferDetail = ProductOffer & {
  relatedOffers: ProductOffer[];
};

export type RecommendationAnswers = {
  lifeSituation?: "CHILD_SCHOOL" | "CHILD_JUNIOR" | "STUDENT" | "SENIOR" | "ADULT_EMPLOYEE" | "CAREGIVER" | "OTHER";
  age?: number;
  schoolLevel?: SchoolLevel;
  department?: IdfDepartment;
};

export type TitleRecommendationPayload = {
  householdMemberId: string;
  answers: RecommendationAnswers;
};

export type TitleRecommendationResponse = {
  recommendedOffer: ProductOffer;
  reason: string;
  requiredDocuments: OfferRequiredDocument[];
  nextAction: string;
};

export type SubscriptionRequestStatus =
  | "DRAFT"
  | "WAITING_DOCUMENTS"
  | "UNDER_REVIEW"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "BLOCKED"
  | "CANCELLED";

export type SubscriptionDocumentStatus = "MISSING" | "READY" | "UPLOADED" | "UNDER_REVIEW" | "VALIDATED" | "REJECTED";

export type CreateSubscriptionRequestPayload = {
  householdMemberId: string;
  offerId: string;
  payerMemberId?: string;
  intelligentDossierEnabled: boolean;
  autoRenewalEnabled: boolean;
};

export type SubscriptionRequestResponse = {
  id: string;
  status: SubscriptionRequestStatus;
  autoRenewalEnabled: boolean;
  intelligentDossierEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  household: {
    id: string;
    name: string;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
    profileType: DashboardMemberProfileType;
    relationship: "SELF" | "CHILD" | "RELATIVE";
  };
  payer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  offer: {
    id: string;
    slug: string;
    name: string;
    productType: OfferProductType;
    shortDescription: string;
    priceLabel: string;
    durationLabel: string;
  };
  documents: Array<{
    id: string;
    documentType: OfferDocumentType;
    label: string;
    status: SubscriptionDocumentStatus;
    rejectionReason: string | null;
  }>;
  timeline: Array<{
    key: string;
    label: string;
    status: "DONE" | "CURRENT" | "UPCOMING";
  }>;
};
