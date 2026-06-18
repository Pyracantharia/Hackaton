import { IsIn } from "class-validator";

const ADMIN_SUBSCRIPTION_REQUEST_STATUSES = [
  "UNDER_REVIEW",
  "WAITING_DOCUMENTS",
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "PAYMENT_CANCELLED",
  "CONFIRMED",
  "BLOCKED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
] as const;

export class UpdateAdminSubscriptionRequestDto {
  @IsIn(ADMIN_SUBSCRIPTION_REQUEST_STATUSES)
  status: (typeof ADMIN_SUBSCRIPTION_REQUEST_STATUSES)[number];
}
