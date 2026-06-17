-- CreateEnum
CREATE TYPE "SupportCaseResolution" AS ENUM ('TRANSFER_TO_PHONE', 'DEACTIVATE_ONLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupportCaseStatus" ADD VALUE 'TRANSFER_TO_PHONE_REQUESTED';
ALTER TYPE "SupportCaseStatus" ADD VALUE 'PASS_DEACTIVATION_REQUESTED';
ALTER TYPE "SupportCaseStatus" ADD VALUE 'CANCELLED_BY_USER';

-- AlterTable
ALTER TABLE "SupportCase" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "chosenResolution" "SupportCaseResolution",
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);
