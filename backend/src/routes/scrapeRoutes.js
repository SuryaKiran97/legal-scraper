import { Router } from "express";
import { addTshcLiveStatusJob, addTshcAdvocateJob } from "../queues/scrapeQueue.js";

const router = Router();

/** POST /api/scrape/tshc-live-status — enqueue TSHC live status scrape (also runs daily at 6 AM). */
router.post("/tshc-live-status", async (req, res) => {
  try {
    const job = await addTshcLiveStatusJob();
    res.status(202).json({ ok: true, jobId: job.id, message: "tshc-live-status job queued" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/scrape/tshc-advocate/:advocateName — enqueue TSHC advocate-wise scrape for the given advocate. */
router.post("/tshc-advocate/:advocateName?", async (req, res) => {
  try {
    const advocateName = req.params.advocateName ? decodeURIComponent(req.params.advocateName) : req.body?.advocateName;
    const job = await addTshcAdvocateJob(advocateName);
    res.status(202).json({ ok: true, jobId: job.id, advocateName: job.data?.advocateName, message: "tshc-advocate job queued" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
