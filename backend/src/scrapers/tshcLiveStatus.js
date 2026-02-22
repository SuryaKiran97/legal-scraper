/**
 * Telangana High Court - Cause list upload status scraper
 * URL: https://causelist.tshc.gov.in/live-status
 *
 * Extracts table of court halls and their cause list upload status for the day.
 * Use returned pdfUrl values later to scrape actual hearing cases from each PDF/list.
 *
 * Run standalone: from backend folder: node src/scrapers/tshcLiveStatus.js
 * From backend/src: node scrapers/tshcLiveStatus.js
 */

import { chromium } from "playwright";

const LIVE_STATUS_URL = "https://causelist.tshc.gov.in/live-status";

/** Parse "DD-MM-YYYY HH:mm" or "DD-MM-YYYY" into Date. Returns null if invalid. */
function parseStatusDateTime(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  // DD-MM-YYYY HH:mm or DD-MM-YYYY
  const match = trimmed.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/
  );
  if (!match) return null;
  const [, d, m, y, h = "0", min = "0"] = match;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(min, 10));
  return isNaN(date.getTime()) ? null : date;
}

/** Extract status date from heading text e.g. "CAUSE LIST UPLOADING STATUS DATED: 23-02-2026" */
function parseStatusDateFromHeading(headingText) {
  if (!headingText) return null;
  const match = String(headingText).match(/DATED:\s*(\d{1,2}-\d{1,2}-\d{4})/i);
  if (!match) return null;
  return parseStatusDateTime(match[1].trim());
}

/**
 * Scrape the TSHC live cause list upload status page.
 * @returns {Promise<Array<{ slNo: number | null, courtHallNo: string, benchName: string | null, listType: string | null, status: string, uploadedAt: Date | null, pdfUrl: string | null, statusDate: Date }>>}
 */
export async function scrapeLiveStatus() {
  const browser = await chromium.launch({ headless: false });

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    await page.goto(LIVE_STATUS_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for the main table to be present and visible
    const table = page.locator("table").first();
    await table.waitFor({ state: "visible", timeout: 15000 });

    // Extract status date from page — "CAUSE LIST UPLOADING STATUS DATED: 23-02-2026"
    // Search body text so we don't depend on a specific heading tag or class
    const bodyText = await page.locator("body").textContent();
    const statusDate = parseStatusDateFromHeading(bodyText);
    if (!statusDate) {
      throw new Error(
        "Could not extract status date from page (expected text like 'CAUSE LIST UPLOADING STATUS DATED: DD-MM-YYYY')"
      );
    }

    // Data rows: tbody tr (skips thead), or all tr if no tbody
    const tbodyRows = await table.locator("tbody tr").all();
    const rowElements = tbodyRows.length > 0 ? tbodyRows : await table.locator("tr").all();
    if (rowElements.length === 0) throw new Error("No table rows found on the page.");

    const results = [];

    for (let i = 0; i < rowElements.length; i++) {
      const row = rowElements[i];
      const cells = await row.locator("td").all();
      if (cells.length < 5) continue; // skip header or empty rows

      const getText = async (idx) => {
        if (idx >= cells.length) return null;
        const t = await cells[idx].textContent();
        return t ? t.trim() : null;
      };

      // Column order: SNo, Court Hall No, Hon'ble Bench, ListType, Status, Uploaded Date, PDF View (link)
      const slNoRaw = await getText(0);
      const courtHallNo = (await getText(1)) ?? "";
      const benchName = await getText(2);
      const listType = await getText(3);
      const status = (await getText(4)) ?? "";
      const uploadedDateStr = await getText(5);

      if (!courtHallNo && !benchName && !status) continue;

      const parsed = parseInt(slNoRaw, 10);
      const slNo = slNoRaw != null && slNoRaw !== "" && !isNaN(parsed) ? parsed : null;
      const uploadedAt = parseStatusDateTime(uploadedDateStr || "");

      const linkEl = cells.length > 6 ? cells[6].locator("a[href]").first() : row.locator("a[href]").first();
      let pdfUrl = await linkEl.getAttribute("href").catch(() => null);
      if (pdfUrl && !pdfUrl.startsWith("http")) pdfUrl = new URL(pdfUrl, LIVE_STATUS_URL).href;
      if (status.toUpperCase().includes("ON LEAVE")) pdfUrl = null;

      results.push({
        slNo,
        courtHallNo,
        benchName: benchName || null,
        listType: listType || null,
        status,
        uploadedAt,
        pdfUrl,
        statusDate,
      });
    }

    if (results.length === 0) {
      throw new Error("Table found but no data rows could be parsed. Check column order and selectors.");
    }

    return results;
  } catch (err) {
    throw new Error(`TSHC live status scrape failed: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// --- Standalone runner for testing ---
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tshcLiveStatus.js");
if (isMain) {
  scrapeLiveStatus()
    .then((data) => {
      console.log("Status date:", data[0]?.statusDate);
      console.log("Rows:", data.length);
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
