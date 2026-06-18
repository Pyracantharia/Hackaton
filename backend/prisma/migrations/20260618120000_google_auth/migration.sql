CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

ALTER TABLE "User"
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "providerId" TEXT,
ADD COLUMN "avatarUrl" TEXT;

CREATE UNIQUE INDEX "User_authProvider_providerId_key" ON "User"("authProvider", "providerId");
