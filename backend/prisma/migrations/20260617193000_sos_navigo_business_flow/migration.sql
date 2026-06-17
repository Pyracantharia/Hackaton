-- AlterEnum
ALTER TYPE "SupportCaseStatus" ADD VALUE 'PHYSICAL_PASS_REACTIVATED';

-- AlterTable
ALTER TABLE "SupportCase"
ADD COLUMN "pickupDeadlineAt" TIMESTAMP(3),
ADD COLUMN "passDestroyedAt" TIMESTAMP(3),
ADD COLUMN "physicalPassReactivatedAt" TIMESTAMP(3),
ADD COLUMN "digitalSupportRating" INTEGER;
