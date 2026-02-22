import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { run as runExampleScraper } from "../scrapers/example-scraper.js";

const prisma = new PrismaClient();
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port || "6379", 10),
  password: new URL(REDIS_URL).password || undefined,
};

const worker = new Worker(
  "scrape-court",
  async (job) => {
    const { courtId } = job.data;
    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court) throw new Error(`Court not found: ${courtId}`);

    const log = await prisma.scrapeLog.create({
      data: { courtId, status: "running" },
    });

    // Route to appropriate scraper by court code or use example
    const result = await runExampleScraper({
      scrapeLogId: log.id,
      court,
      prisma,
    });

    if (result.error) throw new Error(result.error);
    return { scrapeLogId: log.id, count: result.count };
  },
  {
    connection,
    concurrency: parseInt(process.env.SCRAPE_WORKER_CONCURRENCY ?? "1", 10),
  }
);

worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed: ${result.count} records`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Scrape worker started, queue: scrape-court");
