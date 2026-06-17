import { IsIn } from "class-validator";

const ADMIN_SUPPORT_CASE_STATUSES = ["IN_PROGRESS", "RESOLVED"] as const;

export class UpdateAdminSupportCaseDto {
  @IsIn(ADMIN_SUPPORT_CASE_STATUSES)
  status: (typeof ADMIN_SUPPORT_CASE_STATUSES)[number];
}
