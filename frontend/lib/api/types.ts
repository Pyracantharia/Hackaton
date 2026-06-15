export type SchoolLevel = "PRIMARY" | "COLLEGE" | "LYCEE" | "HIGHER_EDUCATION" | "OTHER";
export type IdfDepartment = "75" | "77" | "78" | "91" | "92" | "93" | "94" | "95";

export type RegisterFamilyPayload = {
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
  child: {
    firstName: string;
    lastName: string;
    birthDate: string;
    schoolLevel: SchoolLevel;
    department: IdfDepartment;
  };
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
