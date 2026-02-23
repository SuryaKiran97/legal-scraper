import "dotenv/config";
import express from "express";
import cors from "cors";
import scrapeRoutes from "./routes/scrapeRoutes.js";
import scrapeLogRoutes from "./routes/scrapeLogRoutes.js";
import hearingRoutes from "./routes/hearingRoutes.js";
import liveStatusRoutes from "./routes/liveStatusRoutes.js";
import { startTshcLiveStatusSchedule } from "./queues/scrapeQueue.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://legal-scraper.vercel.app'
  ]
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/scrape", scrapeRoutes);
app.use("/api/scrape-logs", scrapeLogRoutes);
app.use("/api/hearings", hearingRoutes);
app.use("/api/cause-list-status", liveStatusRoutes);

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  try {
    await startTshcLiveStatusSchedule();
    console.log("TSHC live-status daily schedule (6:00 AM) registered");
  } catch (err) {
    const msg = err?.message ?? (err?.errors?.[0]?.message) ?? String(err);
    if (msg.includes("ECONNREFUSED") || msg.includes("6379")) {
      console.warn("Redis not available — queue/schedule disabled. Start Redis (e.g. port 6379) to use scrape jobs and daily schedule.");
    } else {
      console.warn("Could not register repeat schedule:", msg);
    }
  }
});
