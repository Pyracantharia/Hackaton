import { IsIn } from "class-validator";

const ADMIN_SUBSCRIPTION_REQUEST_STATUSES = [
  "UNDER_REVIEW",
  "WAITING_DOCUMENTS",
  "CONFIRMED",
  "BLOCKED",
] as const;

export class UpdateAdminSubscriptionRequestDto {
  @IsIn(ADMIN_SUBSCRIPTION_REQUEST_STATUSES)
  status: (typeof ADMIN_SUBSCRIPTION_REQUEST_STATUSES)[number];
}
