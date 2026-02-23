import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { run as runExampleScraper } from "../scrapers/example-scraper.js";

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL?.trim();
const connection = redisUrl
  ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
  : { host: "localhost", port: 6379 };

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
