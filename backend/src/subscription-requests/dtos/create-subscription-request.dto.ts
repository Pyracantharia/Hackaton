import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSubscriptionRequestDto {
  @IsString()
  @IsNotEmpty()
  householdMemberId: string;

  @IsString()
  @IsNotEmpty()
  offerId: string;

  @IsString()
  @IsOptional()
  payerMemberId?: string;

  @IsBoolean()
  intelligentDossierEnabled: boolean;

  @IsBoolean()
  autoRenewalEnabled: boolean;
}
