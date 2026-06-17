import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export const SCHOOL_LEVELS = [
  "PRIMARY",
  "COLLEGE",
  "LYCEE",
  "HIGHER_EDUCATION",
  "OTHER",
] as const;

export const IDF_DEPARTMENTS = ["75", "77", "78", "91", "92", "93", "94", "95"] as const;
export const REGISTER_MEMBER_TYPES = ["YOUNG", "SENIOR"] as const;
export const REGISTER_MEMBER_RELATIONSHIPS = ["CHILD", "RELATIVE"] as const;
export const SENIOR_RELATIONSHIPS = ["PARENT", "GRAND_PARENT", "SPOUSE", "CAREGIVER", "OTHER"] as const;

export class RegisterFamilyParentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{12,}$/, {
    message:
      "Le mot de passe doit contenir 12 caractères minimum, une minuscule, une majuscule, un chiffre, un caractère spécial et aucun espace.",
  })
  password: string;
}

export class RegisterFamilyChildDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsISO8601()
  birthDate: string;

  @IsIn(SCHOOL_LEVELS)
  schoolLevel: (typeof SCHOOL_LEVELS)[number];

  @IsIn(IDF_DEPARTMENTS)
  department: (typeof IDF_DEPARTMENTS)[number];
}

export class RegisterFamilyMemberDto {
  @IsIn(REGISTER_MEMBER_TYPES)
  type: (typeof REGISTER_MEMBER_TYPES)[number];

  @IsIn(REGISTER_MEMBER_RELATIONSHIPS)
  relationship: (typeof REGISTER_MEMBER_RELATIONSHIPS)[number];

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsISO8601()
  birthDate: string;

  @IsIn(IDF_DEPARTMENTS)
  department: (typeof IDF_DEPARTMENTS)[number];

  @IsOptional()
  @IsIn(SCHOOL_LEVELS)
  schoolLevel?: (typeof SCHOOL_LEVELS)[number];

  @IsOptional()
  @IsIn(SENIOR_RELATIONSHIPS)
  seniorRelationship?: (typeof SENIOR_RELATIONSHIPS)[number];

  @IsBoolean()
  isHolder: boolean;

  @IsBoolean()
  isPayer: boolean;
}

export class RegisterFamilyRolesDto {
  @IsBoolean()
  parentIsLegalRepresentative: boolean;

  @IsBoolean()
  parentIsPayer: boolean;

  @IsBoolean()
  sameAddress: boolean;
}

export class RegisterFamilyConsentsDto {
  @IsBoolean()
  serviceAlerts: boolean;

  @IsBoolean()
  mobilityNews: boolean;

  @IsBoolean()
  partnerOffers: boolean;
}

export class RegisterFamilyVerificationDto {
  @IsString()
  smsCode: string;

  @IsString()
  emailCode: string;
}

export class RegisterFamilyDto {
  @ValidateNested()
  @Type(() => RegisterFamilyParentDto)
  @IsObject()
  parent: RegisterFamilyParentDto;

  @ValidateNested()
  @Type(() => RegisterFamilyChildDto)
  @IsObject()
  @IsOptional()
  child?: RegisterFamilyChildDto;

  @ValidateNested({ each: true })
  @Type(() => RegisterFamilyMemberDto)
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  members?: RegisterFamilyMemberDto[];

  @ValidateNested()
  @Type(() => RegisterFamilyRolesDto)
  @IsObject()
  roles: RegisterFamilyRolesDto;

  @ValidateNested()
  @Type(() => RegisterFamilyConsentsDto)
  @IsObject()
  consents: RegisterFamilyConsentsDto;

  @ValidateNested()
  @Type(() => RegisterFamilyVerificationDto)
  @IsObject()
  verification: RegisterFamilyVerificationDto;
}
