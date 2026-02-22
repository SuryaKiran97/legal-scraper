import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/** GET /api/live-status — list live status rows (court hall upload status) with optional filters. */
router.get("/", async (req, res) => {
  try {
    const courtId = req.query.courtId;
    const statusDate = req.query.statusDate;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const where = {};
    if (courtId) where.courtId = courtId;
    if (statusDate) {
      const d = new Date(statusDate);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setUTCHours(23, 59, 59, 999);
        where.statusDate = { gte: start, lte: end };
      }
    }

    const model = prisma.causeListStatus ?? prisma.liveStatus;
    if (!model) return res.status(500).json({ error: "Prisma client missing cause list status model. Run: npx prisma generate (stop worker first)." });
    const rows = await model.findMany({
      where,
      orderBy: [{ statusDate: "desc" }, { slNo: "asc" }],
      take: limit,
      include: { court: { select: { id: true, name: true, code: true } } },
    });

    res.json({ liveStatuses: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
