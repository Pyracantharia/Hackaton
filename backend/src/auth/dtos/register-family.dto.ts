import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsPhoneNumber,
  IsString,
  Matches,
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
  child: RegisterFamilyChildDto;

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
