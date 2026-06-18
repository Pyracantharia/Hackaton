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
    password?: string;
    authProvider?: "LOCAL" | "GOOGLE";
    googleIdToken?: string;
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

export type GoogleProfileResponse = {
  provider: "GOOGLE";
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
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

export type SubscriptionRequestStatus =
  | "DRAFT"
  | "WAITING_DOCUMENTS"
  | "UNDER_REVIEW"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_CANCELLED"
  | "CONFIRMED"
  | "ACTIVE"
  | "BLOCKED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export type MemberTitleActionStatus =
  | "NO_TITLE"
  | "REQUEST_DRAFT"
  | "REQUEST_IN_PROGRESS"
  | "ACTIVE_TITLE"
  | "TITLE_TO_RENEW"
  | "TITLE_EXPIRED";

export type SubscriptionRenewalType = "ANNUAL" | "MONTHLY";
export type SubscriptionRenewalStatus = "ACTIVE" | "DISABLED" | "CANCELLED" | "EXPIRED";

export type SubscriptionRenewal = {
  enabled: boolean;
  type: SubscriptionRenewalType | null;
  status: SubscriptionRenewalStatus;
  months: number | null;
  monthsRemaining: number | null;
  nextDate: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  label: string;
  canCancel: boolean;
};

export type DashboardPendingRequest = {
  id: string;
  requestNumber: string | null;
  status: SubscriptionRequestStatus;
  offerName: string;
  offerSlug: string;
  offerProductType: string;
  flowType: "GENERIC" | "IMAGINE_R" | null;
  updatedAt: string;
  renewal: SubscriptionRenewal;
};

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
  titleActionStatus: MemberTitleActionStatus;
  pendingRequest: DashboardPendingRequest | null;
};

export type DashboardNotification = {
  id: string;
  type: "RENEWAL" | "OFFER_RECOMMENDATION" | "SERVICE_INFO" | "SUPPORT_UPDATE";
  severity: DashboardNotificationSeverity;
  title: string;
  message: string;
  memberId: string | null;
  createdAt: string;
  subscriptionRequest: DashboardPendingRequest | null;
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

export type HouseholdProcedureType =
  | "SUBSCRIPTION"
  | "RENEWAL"
  | "SOS_NAVIGO"
  | "FOUND_PASS"
  | "SUPPORT_SWITCH"
  | "DOCUMENT"
  | "PAYMENT";

export type HouseholdProcedure = {
  id: string;
  profileName: string;
  profileId: string | null;
  type: HouseholdProcedureType;
  title: string;
  relatedTitle: string | null;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  nextAction: string;
  detailUrl: string;
};

export type HouseholdProceduresResponse = {
  procedures: HouseholdProcedure[];
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
  navigoPass: NavigoPass | null;
  householdRole: string;
  overview: string;
  supportNote: string;
  accessibilityNote: string | null;
  documents: string[];
  actions: MemberDetailAction[];
  alerts: DashboardNotification[];
};

export type NavigoPassSupportType = "PHYSICAL" | "DIGITAL";

export type NavigoPassStatus = "ACTIVE" | "IN_PROGRESS" | "DISABLED";

export type NavigoPassSwitchHistory = {
  id: string;
  previousSupport: NavigoPassSupportType;
  newSupport: NavigoPassSupportType;
  createdAt: string;
};

export type NavigoPass = {
  id: string;
  holderName: string;
  navigoNumberMasked: string;
  productName: string;
  supportType: NavigoPassSupportType;
  status: NavigoPassStatus;
  monthlySwitchLimit: number;
  switchesUsedThisMonth: number;
  switchesRemainingThisMonth: number;
  history: NavigoPassSwitchHistory[];
};

export type LostPassReason = "LOST" | "STOLEN" | "DAMAGED" | "UNKNOWN";

export type SupportCaseResolution = "TRANSFER_TO_PHONE" | "DEACTIVATE_ONLY";

export type SupportCaseType = "LOST_PASS" | "FOUND_PASS" | "DOCUMENT_REJECTED" | "PAYMENT_BLOCKED";

export type SupportCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "TRANSFER_TO_PHONE_REQUESTED"
  | "PASS_DEACTIVATION_REQUESTED"
  | "PASS_FOUND_WAITING_PICKUP"
  | "PASS_PICKED_UP"
  | "DIGITAL_SUPPORT_CONFIRMED"
  | "PHYSICAL_PASS_REACTIVATION_REQUESTED"
  | "PHYSICAL_PASS_REACTIVATED"
  | "RESOLVED"
  | "CANCELLED_BY_USER";

export type SupportCaseFinalChoice = "DIGITAL_SUPPORT" | "PHYSICAL_PASS_REACTIVATION";

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
  foundLocation: string | null;
  foundDeskName: string | null;
  foundDeskAddress: string | null;
  foundAt: string | null;
  clientNotifiedAt: string | null;
  pickedUpAt: string | null;
  finalChoice: SupportCaseFinalChoice | null;
  finalChoiceAt: string | null;
  pickupDeadlineAt: string | null;
  passDestroyedAt: string | null;
  physicalPassReactivatedAt: string | null;
  digitalSupportRating: number | null;
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

export type SubscriptionDocumentStatus = "MISSING" | "READY" | "UPLOADED" | "UNDER_REVIEW" | "VALIDATED" | "REJECTED";
export type SubscriptionRequestFlow = "GENERIC" | "IMAGINE_R";
export type ImagineRScholarshipStatus = "YES" | "NO" | "UNKNOWN";
export type ImagineRDeliveryMode = "PAYER_HOME";
export type SubscriptionRequestAddressType = "HOLDER" | "PAYER";

export type CreateSubscriptionRequestPayload = {
  householdMemberId: string;
  offerId: string;
  payerMemberId?: string;
  intelligentDossierEnabled: boolean;
  autoRenewalEnabled: boolean;
  renewalMonths?: number;
};

export type ImagineRAddressPayload = {
  type?: SubscriptionRequestAddressType;
  street: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postalCode: string;
  city: string;
  country?: string;
};

export type CreateImagineRSubscriptionDraftPayload = {
  householdMemberId: string;
  offerId: string;
  payerMemberId?: string;
};

export type ImagineRDocumentUploadPayload = {
  documentType: OfferDocumentType;
  label?: string;
  simulatedFileName?: string;
  simulatedMimeType?: string;
  simulatedSizeBytes?: number;
  simulatedPreviewDataUrl?: string;
};

export type UpdateImagineRSubscriptionPayload = {
  hasPreviousImagineR?: boolean;
  hasCustomerNumber?: boolean;
  customerNumber?: string;
  infoCertificationAccepted?: boolean;
  holderAddressSameAsPayer?: boolean;
  payerBirthDate?: string;
  schoolZipOrCity?: string;
  schoolName?: string;
  imagineRSchoolLevel?: SchoolLevel;
  scholarshipStatus?: ImagineRScholarshipStatus;
  autoRenewalEnabled?: boolean;
  intelligentDossierEnabled?: boolean;
  signatureInformationAccepted?: boolean;
  signaturePayerAccepted?: boolean;
  signatureTermsAccepted?: boolean;
  signatureDocumentsAccepted?: boolean;
  addresses?: Array<ImagineRAddressPayload & { type: SubscriptionRequestAddressType }>;
  documents?: ImagineRDocumentUploadPayload[];
};

export type SubscriptionRequestResponse = {
  id: string;
  requestNumber: string | null;
  flowType: SubscriptionRequestFlow;
  status: SubscriptionRequestStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  paymentConfirmedAt: string | null;
  paymentCancelledAt: string | null;
  stripeCheckoutSessionId: string | null;
  autoRenewalEnabled: boolean;
  renewal: SubscriptionRenewal;
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
    simulatedFileName?: string | null;
    simulatedMimeType?: string | null;
    simulatedSizeBytes?: number | null;
    simulatedPreviewDataUrl?: string | null;
    hasStoredFile?: boolean;
    uploadedAt?: string | null;
  }>;
  imagineR: {
    hasPreviousImagineR: boolean | null;
    hasCustomerNumber: boolean | null;
    customerNumber: string | null;
    infoCertificationAccepted: boolean;
    holderAddressSameAsPayer: boolean;
    payerBirthDate: string | null;
    schoolZipOrCity: string | null;
    schoolName: string | null;
    schoolLevel: SchoolLevel | null;
    scholarshipStatus: ImagineRScholarshipStatus | null;
    forfaitStartDate: string | null;
    validityStartDate: string | null;
    validityEndDate: string | null;
    deliveryMode: ImagineRDeliveryMode | null;
    baseAmountCents: number | null;
    feeAmountCents: number | null;
    totalAmountCents: number | null;
    currency: string;
    signatureInformationAccepted: boolean;
    signaturePayerAccepted: boolean;
    signatureTermsAccepted: boolean;
    signatureDocumentsAccepted: boolean;
    signedAt: string | null;
    paymentSimulatedAt: string | null;
    submittedAt: string | null;
    addresses: {
      holder?: Omit<ImagineRAddressPayload, "type"> & { id: string };
      payer?: Omit<ImagineRAddressPayload, "type"> & { id: string };
    };
  } | null;
  timeline: Array<{
    key: string;
    label: string;
    status: "DONE" | "CURRENT" | "UPCOMING";
  }>;
};

export type AdminHouseholdStatus = "OK" | "WAITING_DOCUMENTS" | "TO_REVIEW" | "BLOCKED" | "SUPPORT_OPEN";
export type AdminSupportCaseStatus = SupportCaseStatus;
export type AdminSupportCaseType = "LOST_PASS" | "FOUND_PASS" | "DOCUMENT_REJECTED" | "PAYMENT_BLOCKED";

export type AdminRecentActivity = {
  id: string;
  type: string;
  label: string;
  familyId: string | null;
  customerNumber: string | null;
  createdAt: string;
};

export type AdminFamilySummary = {
  id: string;
  customerNumber: string;
  name: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  profilesCount: number;
  openRequestsCount: number;
  lastEvent: {
    label: string;
    createdAt: string;
  } | null;
  status: AdminHouseholdStatus;
};

export type AdminSubscriptionRequest = {
  id: string;
  requestNumber: string | null;
  dossierNumber: string;
  flowType: SubscriptionRequestFlow;
  status: SubscriptionRequestStatus;
  autoRenewalEnabled: boolean;
  intelligentDossierEnabled: boolean;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  paymentSimulatedAt: string | null;
  documentCounts: {
    validated: number;
    total: number;
  };
  household: {
    id: string;
    customerNumber: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    age: number | null;
    profileType: DashboardMemberProfileType;
    relationship: "SELF" | "CHILD" | "RELATIVE";
    schoolLevel: SchoolLevel | null;
    department: string | null;
  };
  payer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
  offer: {
    id: string;
    slug: string;
    name: string;
    productType: OfferProductType;
    priceLabel: string;
    durationLabel: string;
    targetProfile: OfferTargetProfile;
  };
  documents: Array<{
    id: string;
    label: string;
    documentType: OfferDocumentType;
    status: SubscriptionDocumentStatus;
    rejectionReason: string | null;
    simulatedFileName?: string | null;
    simulatedMimeType?: string | null;
    simulatedSizeBytes?: number | null;
    simulatedPreviewDataUrl?: string | null;
    hasStoredFile?: boolean;
    uploadedAt?: string | null;
  }>;
};

export type AdminSubscriptionDocumentPreview = {
  fileName: string | null;
  mimeType: string;
  dataUrl: string;
};

export type AdminSubscriptionRequestFilter =
  | "all"
  | "to-review"
  | "incomplete"
  | "processing"
  | "approved"
  | "rejected"
  | "blocked";

export type AdminSubscriptionRequestDetail = AdminSubscriptionRequest & {
  amounts: {
    baseAmountCents: number | null;
    feeAmountCents: number | null;
    totalAmountCents: number | null;
    currency: string;
    priceLabel: string;
  };
  renewal: {
    enabled: boolean;
    type: SubscriptionRenewalType | null;
    status: SubscriptionRenewalStatus;
    nextDate: string | null;
  };
  holder: AdminSubscriptionRequest["member"] & {
    address: (Omit<ImagineRAddressPayload, "type"> & { id: string }) | null;
    schoolName: string | null;
    schoolZipOrCity: string | null;
    schoolLevel: SchoolLevel | null;
    scholarshipStatus: ImagineRScholarshipStatus | null;
  };
  payer: AdminSubscriptionRequest["payer"] & {
    birthDate: string | null;
    address: (Omit<ImagineRAddressPayload, "type"> & { id: string }) | null;
  };
  signatures: {
    informationAccepted: boolean;
    payerAccepted: boolean;
    termsAccepted: boolean;
    documentsAccepted: boolean;
    signedAt: string | null;
  };
};

export type AdminSupportCase = {
  id: string;
  dossierNumber: string;
  type: AdminSupportCaseType;
  status: AdminSupportCaseStatus;
  reason: LostPassReason | null;
  chosenResolution: SupportCaseResolution | null;
  finalChoice: SupportCaseFinalChoice | null;
  description: string | null;
  passNumberMasked: string | null;
  foundLocation: string | null;
  foundDeskName: string | null;
  foundDeskAddress: string | null;
  foundAt: string | null;
  clientNotifiedAt: string | null;
  pickedUpAt: string | null;
  finalChoiceAt: string | null;
  pickupDeadlineAt: string | null;
  passDestroyedAt: string | null;
  physicalPassReactivatedAt: string | null;
  digitalSupportRating: number | null;
  depositedAtDesk: boolean | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  household: {
    id: string;
    customerNumber: string;
    name: string;
    ownerName: string;
  } | null;
  member: {
    id: string;
      firstName: string;
      lastName: string;
      profileType: DashboardMemberProfileType;
      birthDate?: string | null;
      currentTitle?: {
        id: string;
        productName: string;
        status: DashboardMemberStatus;
      } | null;
    } | null;
  possibleMatch: string | null;
};

export type AdminSosFilter =
  | "all"
  | "active"
  | "transfer"
  | "deactivation"
  | "found"
  | "waiting-pickup"
  | "closed"
  | "cancelled";

export type AdminSosDesk = {
  name: string;
  address: string;
};

export type AdminSosDashboardResponse = {
  stats: {
    totalCases: number;
    activeCases: number;
    foundTodayCount: number;
    waitingPickupCount: number;
    transferToPhoneCount: number;
    deactivationCount: number;
    closedCasesCount: number;
    resolutionRate: number;
    averageDelayHours: number;
    digitalSupportSatisfaction: number | null;
  };
  desks: AdminSosDesk[];
  recentCases: AdminSupportCase[];
};

export type AdminFoundPassResponse = {
  matched: boolean;
  supportCase: AdminSupportCase;
};

export type FinalChoicePayload = {
  finalChoice: SupportCaseFinalChoice;
  digitalSupportRating: number;
};

export type AdminFamilyDetail = AdminFamilySummary & {
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    relationship: "SELF" | "CHILD" | "RELATIVE";
    profileType: DashboardMemberProfileType;
    schoolLevel: SchoolLevel | null;
    department: string | null;
    isHolder: boolean;
    isPayer: boolean;
    isLegalRepresentative: boolean;
    currentSubscription: {
      id: string;
      productName: string;
      status: DashboardMemberStatus;
      recommendedProduct: string | null;
      renewalDate: string | null;
    } | null;
    subscriptionRequests: Array<{
      id: string;
      offerName: string;
      status: SubscriptionRequestStatus;
      intelligentDossierEnabled: boolean;
      autoRenewalEnabled: boolean;
      createdAt: string;
    }>;
    expectedDocuments: string[];
    supportCases: Array<{
      id: string;
      type: AdminSupportCaseType;
      status: AdminSupportCaseStatus;
      description: string | null;
      createdAt: string;
    }>;
  }>;
  subscriptionRequests: AdminSubscriptionRequest[];
  supportCases: AdminSupportCase[];
  history: Array<{
    id: string;
    label: string;
    memberId: string | null;
    createdAt: string;
  }>;
};

export type AdminDashboardResponse = {
  stats: {
    familiesCount: number;
    profilesCount: number;
    openSubscriptionRequestsCount: number;
    lostPassesCount: number;
    foundPassesCount: number;
    dossiersToReviewCount: number;
  };
  recentActivity: AdminRecentActivity[];
  families: AdminFamilySummary[];
  subscriptionRequests: AdminSubscriptionRequest[];
  supportCases: AdminSupportCase[];
};

export type AdminSearchResult = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
  customerNumber: string | null;
  manager?: AdminFamilySummary["manager"];
  family?: AdminUserRow["family"];
  status: AdminHouseholdStatus;
  profiles?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    profileType: DashboardMemberProfileType;
  }>;
};

export type AdminUserRow = {
  id: string;
  sourceId: string;
  recordType: "ACCOUNT" | "PROFILE";
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "EMPLOYEE" | "ADMIN";
  customerNumber: string | null;
  type: DashboardMemberProfileType;
  family: {
    id: string;
    name: string;
    customerNumber: string;
  } | null;
  status: AdminHouseholdStatus;
};

export type AdminManagementDetail = {
  id: string;
  sourceId: string;
  recordType: "ACCOUNT" | "PROFILE";
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "USER" | "EMPLOYEE" | "ADMIN";
    type: DashboardMemberProfileType;
  };
  household: {
    id: string;
    name: string;
    customerNumber: string;
    managerName: string;
    managerEmail: string;
  } | null;
  householdRole: string;
  flags: {
    isHolder: boolean;
    isPayer: boolean;
    isLegalRepresentative: boolean;
  };
  profiles: Array<{
    id: string;
    firstName: string;
    lastName: string;
    profileType: DashboardMemberProfileType;
    relationship: "SELF" | "CHILD" | "RELATIVE";
  }>;
  subscriptions: Array<{
    id: string;
    productName: string;
    status: DashboardMemberStatus;
    passNumberMasked: string | null;
    renewalDate: string | null;
  }>;
  subscriptionRequests: Array<{
    id: string;
    offerName: string;
    status: SubscriptionRequestStatus;
    intelligentDossierEnabled: boolean;
    autoRenewalEnabled: boolean;
    documents: Array<{
      id: string;
      label: string;
      status: SubscriptionDocumentStatus;
      rejectionReason: string | null;
    }>;
    createdAt: string;
  }>;
  supportCases: AdminSupportCase[];
  expectedDocuments: string[];
  history: Array<{
    id: string;
    label: string;
    createdAt: string;
  }>;
};
