import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/** GET /api/scrape-logs — list scrape logs with optional courtId and limit. */
router.get("/", async (req, res) => {
  try {
    const courtId = req.query.courtId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const logs = await prisma.scrapeLog.findMany({
      where: courtId ? { courtId } : undefined,
      orderBy: { startedAt: "desc" },
      take: limit,
      include: { court: { select: { id: true, name: true, code: true } } },
    });
    const withDuration = logs.map((log) => ({
      ...log,
      durationMs: log.completedAt ? new Date(log.completedAt) - new Date(log.startedAt) : null,
    }));
    res.json({ logs: withDuration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
