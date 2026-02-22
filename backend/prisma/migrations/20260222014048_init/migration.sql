-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "url" TEXT,
    "jurisdiction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hearing" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "slNo" INTEGER,
    "caseNumber" TEXT NOT NULL,
    "caseTitle" TEXT,
    "hearingDate" TIMESTAMP(3) NOT NULL,
    "hearingTime" TEXT,
    "hearingMode" TEXT,
    "courtNumber" TEXT,
    "judge" TEXT,
    "room" TEXT,
    "listType" TEXT,
    "hearingCategory" TEXT,
    "petitionerName" TEXT,
    "respondentName" TEXT,
    "petitionerAdvocate" TEXT,
    "respondentAdvocate" TEXT,
    "district" TEXT,
    "status" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterimApplication" (
    "id" TEXT NOT NULL,
    "hearingId" TEXT NOT NULL,
    "iaNumber" TEXT NOT NULL,
    "iaType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterimApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeLog" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "recordsScraped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Court_code_key" ON "Court"("code");

-- CreateIndex
CREATE INDEX "Hearing_courtId_idx" ON "Hearing"("courtId");

-- CreateIndex
CREATE INDEX "Hearing_hearingDate_idx" ON "Hearing"("hearingDate");

-- CreateIndex
CREATE INDEX "Hearing_caseNumber_idx" ON "Hearing"("caseNumber");

-- CreateIndex
CREATE INDEX "Hearing_judge_idx" ON "Hearing"("judge");

-- CreateIndex
CREATE INDEX "Hearing_listType_idx" ON "Hearing"("listType");

-- CreateIndex
CREATE UNIQUE INDEX "Hearing_courtId_caseNumber_hearingDate_key" ON "Hearing"("courtId", "caseNumber", "hearingDate");

-- CreateIndex
CREATE INDEX "InterimApplication_hearingId_idx" ON "InterimApplication"("hearingId");

-- CreateIndex
CREATE INDEX "ScrapeLog_courtId_idx" ON "ScrapeLog"("courtId");

-- CreateIndex
CREATE INDEX "ScrapeLog_startedAt_idx" ON "ScrapeLog"("startedAt");

-- AddForeignKey
ALTER TABLE "Hearing" ADD CONSTRAINT "Hearing_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterimApplication" ADD CONSTRAINT "InterimApplication_hearingId_fkey" FOREIGN KEY ("hearingId") REFERENCES "Hearing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeLog" ADD CONSTRAINT "ScrapeLog_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
