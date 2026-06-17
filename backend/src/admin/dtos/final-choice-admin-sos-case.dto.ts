import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

const FINAL_CHOICES = ["DIGITAL_SUPPORT", "PHYSICAL_PASS_REACTIVATION"] as const;

export class FinalChoiceAdminSosCaseDto {
  @IsIn(FINAL_CHOICES)
  finalChoice: (typeof FINAL_CHOICES)[number];

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  digitalSupportRating?: number;
}
