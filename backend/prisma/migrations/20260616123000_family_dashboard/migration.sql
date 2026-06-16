-- CreateEnum
CREATE TYPE "HouseholdProfileType" AS ENUM ('MANAGER', 'YOUNG', 'SENIOR', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionProductType" AS ENUM ('NAVIGO_ANNUAL', 'IMAGINE_R', 'NAVIGO_JUNIOR', 'NAVIGO_SENIOR', 'AMETHYSTE', 'TST', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TO_RENEW', 'RECOMMENDED', 'PENDING_DOCUMENT', 'BLOCKED', 'LOST', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FamilyNotificationType" AS ENUM ('RENEWAL', 'OFFER_RECOMMENDATION', 'SERVICE_INFO', 'SUPPORT_UPDATE');

-- CreateEnum
CREATE TYPE "FamilyNotificationSeverity" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'DANGER');

-- CreateEnum
CREATE TYPE "SupportCaseType" AS ENUM ('LOST_PASS', 'FOUND_PASS', 'DOCUMENT_REJECTED', 'PAYMENT_BLOCKED');

-- CreateEnum
CREATE TYPE "SupportCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- AlterTable
ALTER TABLE "HouseholdMember"
ADD COLUMN "profileType" "HouseholdProfileType" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "householdMemberId" TEXT NOT NULL,
    "productType" "SubscriptionProductType" NOT NULL,
    "productName" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "nextActionLabel" TEXT,
    "recommendedProduct" TEXT,
    "renewalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyNotification" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT,
    "type" "FamilyNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "FamilyNotificationSeverity" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCase" (
    "id" TEXT NOT NULL,
    "householdId" TEXT,
    "memberId" TEXT,
    "type" "SupportCaseType" NOT NULL,
    "status" "SupportCaseStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "passNumberMasked" TEXT,
    "foundLocation" TEXT,
    "depositedAtDesk" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_householdMemberId_idx" ON "Subscription"("householdMemberId");

-- CreateIndex
CREATE INDEX "FamilyNotification_householdId_idx" ON "FamilyNotification"("householdId");

-- CreateIndex
CREATE INDEX "FamilyNotification_memberId_idx" ON "FamilyNotification"("memberId");

-- CreateIndex
CREATE INDEX "SupportCase_householdId_idx" ON "SupportCase"("householdId");

-- CreateIndex
CREATE INDEX "SupportCase_memberId_idx" ON "SupportCase"("memberId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_householdMemberId_fkey" FOREIGN KEY ("householdMemberId") REFERENCES "HouseholdMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyNotification" ADD CONSTRAINT "FamilyNotification_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyNotification" ADD CONSTRAINT "FamilyNotification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
