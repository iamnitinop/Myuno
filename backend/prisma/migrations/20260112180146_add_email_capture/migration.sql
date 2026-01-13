-- CreateTable
CREATE TABLE "EmailCapture" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCapture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailCapture_accountId_idx" ON "EmailCapture"("accountId");

-- CreateIndex
CREATE INDEX "EmailCapture_campaignId_idx" ON "EmailCapture"("campaignId");

-- CreateIndex
CREATE INDEX "EmailCapture_email_idx" ON "EmailCapture"("email");

-- CreateIndex
CREATE INDEX "EmailCapture_createdAt_idx" ON "EmailCapture"("createdAt");
