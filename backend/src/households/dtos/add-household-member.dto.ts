import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import {
  IDF_DEPARTMENTS,
  REGISTER_MEMBER_RELATIONSHIPS,
  REGISTER_MEMBER_TYPES,
  SCHOOL_LEVELS,
  SENIOR_RELATIONSHIPS,
} from "src/auth/dtos/register-family.dto";

export class AddHouseholdMemberDto {
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
