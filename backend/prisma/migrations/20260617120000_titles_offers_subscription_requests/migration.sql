-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('NAVIGO_ANNUAL', 'IMAGINE_R_JUNIOR', 'IMAGINE_R_SCHOOL', 'IMAGINE_R_STUDENT', 'NAVIGO_SENIOR', 'AMETHYSTE', 'NAVIGO_LIBERTE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TargetProfile" AS ENUM ('CHILD', 'YOUNG', 'STUDENT', 'SENIOR', 'ADULT', 'FAMILY', 'SOLIDARITY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PHOTO', 'SCHOOL_CERTIFICATE', 'ID_DOCUMENT', 'ADDRESS_PROOF', 'SCHOLARSHIP_CERTIFICATE', 'SITUATION_PROOF', 'PAYMENT_METHOD');

-- CreateEnum
CREATE TYPE "SubscriptionRequestStatus" AS ENUM ('DRAFT', 'WAITING_DOCUMENTS', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionDocumentStatus" AS ENUM ('MISSING', 'READY', 'UPLOADED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "durationLabel" TEXT NOT NULL,
    "targetProfile" "TargetProfile" NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferBenefit" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRequiredDocument" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferRequiredDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRequest" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "payerMemberId" TEXT,
    "status" "SubscriptionRequestStatus" NOT NULL DEFAULT 'WAITING_DOCUMENTS',
    "autoRenewalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "intelligentDossierEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionDocument" (
    "id" TEXT NOT NULL,
    "subscriptionRequestId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "status" "SubscriptionDocumentStatus" NOT NULL DEFAULT 'MISSING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductOffer_slug_key" ON "ProductOffer"("slug");

-- CreateIndex
CREATE INDEX "ProductOffer_productType_idx" ON "ProductOffer"("productType");

-- CreateIndex
CREATE INDEX "ProductOffer_targetProfile_idx" ON "ProductOffer"("targetProfile");

-- CreateIndex
CREATE INDEX "ProductOffer_isActive_order_idx" ON "ProductOffer"("isActive", "order");

-- CreateIndex
CREATE INDEX "OfferBenefit_offerId_idx" ON "OfferBenefit"("offerId");

-- CreateIndex
CREATE INDEX "OfferRequiredDocument_offerId_idx" ON "OfferRequiredDocument"("offerId");

-- CreateIndex
CREATE INDEX "SubscriptionRequest_householdId_idx" ON "SubscriptionRequest"("householdId");

-- CreateIndex
CREATE INDEX "SubscriptionRequest_memberId_idx" ON "SubscriptionRequest"("memberId");

-- CreateIndex
CREATE INDEX "SubscriptionRequest_offerId_idx" ON "SubscriptionRequest"("offerId");

-- CreateIndex
CREATE INDEX "SubscriptionRequest_payerMemberId_idx" ON "SubscriptionRequest"("payerMemberId");

-- CreateIndex
CREATE INDEX "SubscriptionDocument_subscriptionRequestId_idx" ON "SubscriptionDocument"("subscriptionRequestId");

-- AddForeignKey
ALTER TABLE "OfferBenefit" ADD CONSTRAINT "OfferBenefit_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRequiredDocument" ADD CONSTRAINT "OfferRequiredDocument_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HouseholdMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_payerMemberId_fkey" FOREIGN KEY ("payerMemberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionDocument" ADD CONSTRAINT "SubscriptionDocument_subscriptionRequestId_fkey" FOREIGN KEY ("subscriptionRequestId") REFERENCES "SubscriptionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
