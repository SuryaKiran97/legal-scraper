import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/** GET /api/hearings — list hearings with optional filters and pagination. */
router.get("/", async (req, res) => {
  try {
    const courtId = req.query.courtId;
    const caseNumber = req.query.caseNumber;
    const advocate = req.query.advocate;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const where = {};
    if (courtId) where.courtId = courtId;
    if (caseNumber) where.caseNumber = { contains: caseNumber, mode: "insensitive" };
    if (advocate) {
      where.OR = [
        { petitionerAdvocate: { contains: advocate, mode: "insensitive" } },
        { respondentAdvocate: { contains: advocate, mode: "insensitive" } },
      ];
    }

    const [hearings, total] = await Promise.all([
      prisma.hearing.findMany({
        where,
        orderBy: [{ hearingDate: "desc" }, { caseNumber: "asc" }],
        take: limit,
        skip: offset,
        include: {
          court: { select: { id: true, name: true, code: true } },
          interimApplications: { select: { id: true, iaNumber: true, iaType: true } },
        },
      }),
      prisma.hearing.count({ where }),
    ]);

    res.json({ hearings, total, limit, offset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
