import { IsIn } from "class-validator";

const FINAL_CHOICES = ["DIGITAL_SUPPORT", "PHYSICAL_PASS_REACTIVATION"] as const;

export class FinalChoiceDto {
  @IsIn(FINAL_CHOICES)
  finalChoice: (typeof FINAL_CHOICES)[number];
}
