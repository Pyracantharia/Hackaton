CREATE TYPE "UserRole" AS ENUM ('USER', 'EMPLOYEE', 'ADMIN');
CREATE TYPE "HouseholdRelationship" AS ENUM ('SELF', 'CHILD', 'RELATIVE');
CREATE TYPE "SchoolLevel" AS ENUM ('PRIMARY', 'COLLEGE', 'LYCEE', 'HIGHER_EDUCATION', 'OTHER');
CREATE TYPE "ConsentType" AS ENUM ('SERVICE_ALERTS', 'MOBILITY_NEWS', 'PARTNER_OFFERS');

ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";
ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User"
SET
  "firstName" = COALESCE(NULLIF(split_part("name", ' ', 1), ''), "name"),
  "lastName" = trim(substr("name", length(split_part("name", ' ', 1)) + 1));

ALTER TABLE "User" DROP COLUMN "name";

CREATE TABLE "Household" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdMember" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3),
  "relationship" "HouseholdRelationship" NOT NULL,
  "schoolLevel" "SchoolLevel",
  "department" TEXT,
  "isHolder" BOOLEAN NOT NULL DEFAULT false,
  "isPayer" BOOLEAN NOT NULL DEFAULT false,
  "isLegalRepresentative" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Consent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ConsentType" NOT NULL,
  "accepted" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Household_ownerId_idx" ON "Household"("ownerId");
CREATE INDEX "HouseholdMember_householdId_idx" ON "HouseholdMember"("householdId");
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");
CREATE UNIQUE INDEX "Consent_userId_type_key" ON "Consent"("userId", "type");

ALTER TABLE "Household" ADD CONSTRAINT "Household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
