-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET DEFAULT '',
ALTER COLUMN "updatedAt" DROP DEFAULT;
