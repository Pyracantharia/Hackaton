import { IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

const LIFE_SITUATIONS = [
  "CHILD_SCHOOL",
  "CHILD_JUNIOR",
  "STUDENT",
  "SENIOR",
  "ADULT_EMPLOYEE",
  "CAREGIVER",
  "OTHER",
] as const;

const SCHOOL_LEVELS = ["PRIMARY", "COLLEGE", "LYCEE", "HIGHER_EDUCATION", "OTHER"] as const;
const IDF_DEPARTMENTS = ["75", "77", "78", "91", "92", "93", "94", "95"] as const;

export class RecommendationAnswersDto {
  @IsOptional()
  @IsIn(LIFE_SITUATIONS)
  lifeSituation?: (typeof LIFE_SITUATIONS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsIn(SCHOOL_LEVELS)
  schoolLevel?: (typeof SCHOOL_LEVELS)[number];

  @IsOptional()
  @IsIn(IDF_DEPARTMENTS)
  department?: (typeof IDF_DEPARTMENTS)[number];
}

export class RecommendTitleDto {
  @IsString()
  @IsNotEmpty()
  householdMemberId: string;

  @ValidateNested()
  @Type(() => RecommendationAnswersDto)
  @IsObject()
  answers: RecommendationAnswersDto;
}
