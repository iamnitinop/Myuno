-- DropIndex
DROP INDEX "GlobalBanner_accountId_key";

-- AlterTable
ALTER TABLE "GlobalBanner" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Banner',
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rulesJson" JSONB;

-- CreateIndex
CREATE INDEX "GlobalBanner_accountId_idx" ON "GlobalBanner"("accountId");
