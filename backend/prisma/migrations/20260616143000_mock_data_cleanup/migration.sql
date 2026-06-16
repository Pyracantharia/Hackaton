CREATE TYPE "MemberDetailActionVariant" AS ENUM ('PRIMARY', 'SECONDARY', 'GHOST');

CREATE TABLE "HouseholdActivity" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberProfileDetail" (
    "id" TEXT NOT NULL,
    "householdMemberId" TEXT NOT NULL,
    "householdRole" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "supportNote" TEXT NOT NULL,
    "accessibilityNote" TEXT,
    "documents" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfileDetail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberDetailAction" (
    "id" TEXT NOT NULL,
    "detailId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT,
    "action" TEXT,
    "variant" "MemberDetailActionVariant" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDetailAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HouseholdActivity_householdId_idx" ON "HouseholdActivity"("householdId");
CREATE INDEX "HouseholdActivity_memberId_idx" ON "HouseholdActivity"("memberId");
CREATE UNIQUE INDEX "MemberProfileDetail_householdMemberId_key" ON "MemberProfileDetail"("householdMemberId");
CREATE INDEX "MemberDetailAction_detailId_idx" ON "MemberDetailAction"("detailId");

ALTER TABLE "HouseholdActivity" ADD CONSTRAINT "HouseholdActivity_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdActivity" ADD CONSTRAINT "HouseholdActivity_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HouseholdMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemberProfileDetail" ADD CONSTRAINT "MemberProfileDetail_householdMemberId_fkey" FOREIGN KEY ("householdMemberId") REFERENCES "HouseholdMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberDetailAction" ADD CONSTRAINT "MemberDetailAction_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "MemberProfileDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
