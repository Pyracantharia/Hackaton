import { IsBoolean, IsIn, IsNotEmpty, IsString } from "class-validator";

export const LOST_PASS_REASONS = ["LOST", "STOLEN", "DAMAGED", "UNKNOWN"] as const;
export const LOST_PASS_RESOLUTIONS = ["TRANSFER_TO_PHONE", "DEACTIVATE_ONLY"] as const;

export type LostPassReason = (typeof LOST_PASS_REASONS)[number];
export type LostPassResolution = (typeof LOST_PASS_RESOLUTIONS)[number];

export class CreateLostPassDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsIn(LOST_PASS_REASONS)
  reason: LostPassReason;

  @IsIn(LOST_PASS_RESOLUTIONS)
  chosenResolution: LostPassResolution;

  @IsBoolean()
  understandsDeactivation: boolean;
}
