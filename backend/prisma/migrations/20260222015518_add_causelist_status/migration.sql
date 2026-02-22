-- CreateTable
CREATE TABLE "CauseListStatus" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "slNo" INTEGER,
    "courtHallNo" TEXT NOT NULL,
    "benchName" TEXT,
    "listType" TEXT,
    "status" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "statusDate" TIMESTAMP(3) NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CauseListStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CauseListStatus_courtId_idx" ON "CauseListStatus"("courtId");

-- CreateIndex
CREATE INDEX "CauseListStatus_statusDate_idx" ON "CauseListStatus"("statusDate");

-- CreateIndex
CREATE INDEX "CauseListStatus_status_idx" ON "CauseListStatus"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CauseListStatus_courtHallNo_statusDate_key" ON "CauseListStatus"("courtHallNo", "statusDate");

-- AddForeignKey
ALTER TABLE "CauseListStatus" ADD CONSTRAINT "CauseListStatus_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
