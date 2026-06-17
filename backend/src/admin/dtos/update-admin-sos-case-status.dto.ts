import { IsIn } from "class-validator";

const ADMIN_SOS_CASE_STATUSES = [
  "IN_PROGRESS",
  "PASS_FOUND_WAITING_PICKUP",
  "PASS_PICKED_UP",
  "RESOLVED",
] as const;

export class UpdateAdminSosCaseStatusDto {
  @IsIn(ADMIN_SOS_CASE_STATUSES)
  status: (typeof ADMIN_SOS_CASE_STATUSES)[number];
}
