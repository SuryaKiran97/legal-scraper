import "dotenv/config";
import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port || "6379", 10),
  password: new URL(REDIS_URL).password || undefined,
};

export const SCRAPE_QUEUE_NAME = "scrape";

export const scrapeQueue = new Queue(SCRAPE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

const JOB_TYPES = {
  TSHC_LIVE_STATUS: "tshc-live-status",
  TSHC_ADVOCATE: "tshc-advocate",
};

/** Add tshc-live-status job (also run daily at 6 AM via startScheduler). */
export async function addTshcLiveStatusJob() {
  return scrapeQueue.add(JOB_TYPES.TSHC_LIVE_STATUS, {}, { jobId: `tshc-live-${Date.now()}` });
}

/** Add tshc-advocate job (on demand only). */
export async function addTshcAdvocateJob(advocateName) {
  const name = String(advocateName || "").trim() || "D NARENDAR NAIK";
  return scrapeQueue.add(JOB_TYPES.TSHC_ADVOCATE, { advocateName: name }, { jobId: `tshc-advocate-${encodeURIComponent(name)}-${Date.now()}` });
}

const TSHC_LIVE_CRON = "0 6 * * *";

/** Start the repeatable job: tshc-live-status daily at 6:00 AM. Call once on server start. */
export async function startTshcLiveStatusSchedule() {
  const repeatables = await scrapeQueue.getRepeatableJobs();
  const existing = repeatables.find((r) => (r.pattern === TSHC_LIVE_CRON || r.cron === TSHC_LIVE_CRON) && r.name === JOB_TYPES.TSHC_LIVE_STATUS);
  if (existing && existing.key) await scrapeQueue.removeRepeatableByKey(existing.key).catch(() => {});
  await scrapeQueue.add(JOB_TYPES.TSHC_LIVE_STATUS, {}, { repeat: { pattern: TSHC_LIVE_CRON } });
}

export { JOB_TYPES };
