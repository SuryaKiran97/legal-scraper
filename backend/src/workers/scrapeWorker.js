import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { scrapeLiveStatus } from "../scrapers/tshcLiveStatus.js";
import { scrapeAdvocateCauseList } from "../scrapers/tshcAdvocateWise.js";
import { SCRAPE_QUEUE_NAME, JOB_TYPES } from "../queues/scrapeQueue.js";

const prisma = new PrismaClient();

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port || "6379", 10),
  password: new URL(REDIS_URL).password || undefined,
};

const TSHC_COURT_CODE = "TSHC";

async function getOrCreateTshcCourt() {
  let court = await prisma.court.findUnique({ where: { code: TSHC_COURT_CODE } });
  if (!court) {
    court = await prisma.court.create({
      data: {
        name: "High Court for the State of Telangana",
        code: TSHC_COURT_CODE,
        url: "https://causelist.tshc.gov.in/",
        jurisdiction: "Telangana",
      },
    });
  }
  return court;
}

async function runTshcLiveStatus(courtId) {
  const log = await prisma.scrapeLog.create({
    data: { courtId, status: "running" },
  });
  const startedAt = log.startedAt;

  try {
    const rows = await scrapeLiveStatus();
    let recordsScraped = 0;

    for (const r of rows) {
      await prisma.causeListStatus.upsert({
        where: {
          courtHallNo_statusDate: {
            courtHallNo: r.courtHallNo,
            statusDate: r.statusDate,
          },
        },
        update: {
          status: r.status,
          uploadedAt: r.uploadedAt,
          pdfUrl: r.pdfUrl,
          benchName: r.benchName,
        },
        create: {
          courtId,
          slNo: r.slNo,
          courtHallNo: r.courtHallNo,
          benchName: r.benchName,
          listType: r.listType,
          status: r.status,
          uploadedAt: r.uploadedAt,
          pdfUrl: r.pdfUrl,
          statusDate: r.statusDate,
        },
      });
      recordsScraped++;
    }

    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        status: "completed",
        recordsScraped,
        completedAt: new Date(),
      },
    });

    return { scrapeLogId: log.id, recordsScraped };
  } catch (err) {
    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        errorMessage: err.message,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

async function runTshcAdvocate(advocateName, courtId) {
  const log = await prisma.scrapeLog.create({
    data: { courtId, status: "running" },
  });

  try {
    const { hearings } = await scrapeAdvocateCauseList(advocateName);
    let recordsScraped = 0;

    for (const h of hearings) {
      const hearingDate = h.hearingDate instanceof Date ? h.hearingDate : new Date(h.hearingDate);
      const rawData = {
        advocateName,
        slNo: h.slNo,
        interimApplications: h.interimApplications,
        petitionerName: h.petitionerName,
        respondentName: h.respondentName,
        petitionerAdvocate: h.petitionerAdvocate,
        respondentAdvocate: h.respondentAdvocate,
        district: h.district,
        courtNumber: h.courtNumber,
        judge: h.judge,
        hearingTime: h.hearingTime,
        hearingMode: h.hearingMode,
        listType: h.listType,
        hearingCategory: h.hearingCategory,
      };

      const upserted = await prisma.hearing.upsert({
        where: {
          courtId_caseNumber_hearingDate: {
            courtId,
            caseNumber: h.caseNumber,
            hearingDate,
          },
        },
        update: {
          petitionerAdvocate: h.petitionerAdvocate,
          respondentAdvocate: h.respondentAdvocate,
          listType: h.listType,
          hearingCategory: h.hearingCategory,
          district: h.district,
          rawData,
          updatedAt: new Date(),
        },
        create: {
          courtId,
          slNo: h.slNo,
          caseNumber: h.caseNumber,
          hearingDate,
          hearingTime: h.hearingTime,
          hearingMode: h.hearingMode,
          courtNumber: h.courtNumber,
          judge: h.judge,
          listType: h.listType,
          hearingCategory: h.hearingCategory,
          petitionerName: h.petitionerName,
          respondentName: h.respondentName,
          petitionerAdvocate: h.petitionerAdvocate,
          respondentAdvocate: h.respondentAdvocate,
          district: h.district,
          rawData,
        },
      });

      await prisma.interimApplication.deleteMany({ where: { hearingId: upserted.id } });
      if (Array.isArray(h.interimApplications) && h.interimApplications.length > 0) {
        await prisma.interimApplication.createMany({
          data: h.interimApplications.map((iaNumber) => ({
            hearingId: upserted.id,
            iaNumber: typeof iaNumber === "string" ? iaNumber : String(iaNumber),
          })),
        });
      }
      recordsScraped++;
    }

    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        status: "completed",
        recordsScraped,
        completedAt: new Date(),
      },
    });

    return { scrapeLogId: log.id, recordsScraped };
  } catch (err) {
    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        errorMessage: err.message,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

const worker = new Worker(
  SCRAPE_QUEUE_NAME,
  async (job) => {
    const { name, data } = job;
    const court = await getOrCreateTshcCourt();

    if (name === JOB_TYPES.TSHC_LIVE_STATUS) {
      return runTshcLiveStatus(court.id);
    }
    if (name === JOB_TYPES.TSHC_ADVOCATE) {
      const advocateName = data?.advocateName || "D NARENDAR NAIK";
      return runTshcAdvocate(advocateName, court.id);
    }

    throw new Error(`Unknown job type: ${name}`);
  },
  {
    connection,
    concurrency: parseInt(process.env.SCRAPE_WORKER_CONCURRENCY ?? "1", 10),
  }
);

worker.on("completed", (job, result) => {
  console.log(`[scrapeWorker] ${job.name} ${job.id} completed:`, result?.recordsScraped ?? 0, "records");
});

worker.on("failed", (job, err) => {
  console.error(`[scrapeWorker] ${job?.name} ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts ?? 3}):`, err.message);
});

console.log(`[scrapeWorker] started, queue: ${SCRAPE_QUEUE_NAME}`);
