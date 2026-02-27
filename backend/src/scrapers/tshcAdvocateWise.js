/**
 * Telangana High Court - Advocate-wise cause list scraper
 * Flow: homepage → Daily list → Advocate wise (to establish session) → search → advocateWiseView
 *
 * Searches by advocate name and returns only rows where that advocate appears.
 * Run standalone: from backend folder: node src/scrapers/tshcAdvocateWise.js
 * From backend/src: node scrapers/tshcAdvocateWise.js
 */

import { chromium } from "playwright";

const HOMEPAGE_URL = "https://causelist.tshc.gov.in/";
const ADVOCATE_LIST_URL = "https://causelist.tshc.gov.in/advocateCauseList";
const RESULTS_URL_PATTERN = /advocateWiseView/i;
const NAV_TIMEOUT = 60000;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

/** Parse "23rd day of February 2026" into Date. Returns null if invalid. */
function parseHearingDate(str) {
  if (!str || typeof str !== "string") return null;
  const text = str.trim();
  const match = text.match(/(\d+)(?:st|nd|rd|th)?\s+day\s+of\s+(\w+)\s+(\d{4})/i);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();
  const year = parseInt(match[3], 10);
  const monthIdx = MONTH_NAMES.findIndex((m) => monthName.startsWith(m));
  if (monthIdx === -1) return null;
  const date = new Date(year, monthIdx, day);
  return isNaN(date.getTime()) ? null : date;
}

/** Extract court number from heading e.g. "COURT NO. 14" */
function parseCourtNumber(text) {
  if (!text) return null;
  const m = String(text).match(/COURT\s+NO\.?\s*(\d+)/i);
  return m ? m[1].trim() : null;
}

/** Extract judge name (between COURT NO. X / and next / or "To be heard"). */
function parseJudgeName(text) {
  if (!text) return null;
  const m = String(text).match(/COURT\s+NO\.?\s*\d+\s*\/\s*([^/]+?)(?:\s*\/|\s+To\s+be\s+heard)/is);
  return m ? m[1].trim() : null;
}

/** Extract "To be heard on ... 23rd day of February 2026" date part. */
function parseHearingDateFromHeading(text) {
  if (!text) return null;
  const m = String(text).match(/to\s+be\s+heard\s+on\s+.+?(\d+)(?:st|nd|rd|th)?\s+day\s+of\s+(\w+)\s+(\d{4})/i);
  if (!m) return null;
  return parseHearingDate(`${m[1]} day of ${m[2]} ${m[3]}`);
}

/** Extract time e.g. "10:30 AM" from heading. */
function parseHearingTime(text) {
  if (!text) return null;
  const m = String(text).match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  return m ? m[1].trim() : null;
}

/** Extract mode e.g. "HYBRID MODE" from heading. */
function parseHearingMode(text) {
  if (!text) return null;
  const m = String(text).match(/(HYBRID\s+MODE|PHYSICAL|VIRTUAL|ONLINE)/i);
  return m ? m[1].trim() : null;
}

/** Parse "TOTAL CASES FOR [name] = 14" -> 14 */
function parseTotalCases(bodyText, advocateName) {
  if (!bodyText) return null;
  const m = String(bodyText).match(/TOTAL\s+CASES\s+FOR\s+.+?=\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

/** Extract cause list date from page (e.g. DATED: 23-02-2026 or similar). */
function parseCauseListDate(bodyText) {
  if (!bodyText) return "";
  const m = String(bodyText).match(/(?:DATED|DATE):\s*(\d{1,2}-\d{1,2}-\d{4})/i)
    || String(bodyText).match(/(\d{1,2}-\d{1,2}-\d{4})/);
  return m ? m[1].trim() : "";
}

/** Split party details into petitioner and respondent (by " vs " or " v "). */
function splitPartyDetails(partyDetails) {
  const s = (partyDetails || "").trim();
  const split = s.split(/\s+vs\.?\s+|\s+v\.?\s+/i);
  return {
    petitionerName: split[0]?.trim() || null,
    respondentName: split[1]?.trim() || null,
  };
}

/** Extract main case number and IA numbers from Case column text. */
function parseCaseColumn(text) {
  const t = (text || "").trim();
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const caseNumber = lines[0] || "";
  const interimApplications = lines.slice(1).filter((l) => /IA\s+\d+\/\d+/i.test(l) || /^\d+\/\d+$/.test(l));
  return { caseNumber, interimApplications };
}

/**
 * Scrape advocate-wise cause list: search by name, then extract and filter hearings.
 * @param {string} [advocateName='D NARENDAR NAIK']
 * @returns {Promise<{ advocateName: string, totalCases: number, causeListDate: string, hearings: Array<object> }>}
 */
export async function scrapeAdvocateCauseList(advocateName = "D NARENDAR NAIK") {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    // Establish session: homepage → Daily list → Advocate wise (avoids "Session Expired" on direct /advocateCauseList)
    await page.goto(HOMEPAGE_URL, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const dailyListLink = page.getByRole("link", { name: /daily\s*list/i }).first();
    await dailyListLink.hover().catch(() => {});
    await page.waitForTimeout(500);
    await dailyListLink.click({ timeout: 10000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    const advocateWiseLink = page.getByRole("link", { name: /advocate\s*wise/i }).first();
    await advocateWiseLink.click({ timeout: 10000 });
    await page.waitForURL(/advocateCauseList/i, { timeout: NAV_TIMEOUT });
    await page.waitForLoadState("domcontentloaded");

    // Only visible text input (page has many type="hidden" inputs that would match a bare "input" selector)
    const input = page.locator('input[type="text"]').first();
    await input.waitFor({ state: "visible", timeout: 15000 });
    await input.clear();
    await input.fill(advocateName);

    const submitBtn = page.locator('button:has-text("SUBMIT"), input[type="submit"][value*="SUBMIT"], input[type="submit"], button').filter({ hasText: /SUBMIT/i }).first();
    await submitBtn.click();

    await page.waitForURL(RESULTS_URL_PATTERN, { timeout: NAV_TIMEOUT });
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    const totalCases = parseTotalCases(bodyText, advocateName) ?? 0;
    const causeListDate = parseCauseListDate(bodyText);

    // Get raw table sections (serializable) so we can parse in Node
    const rawSections = await page.evaluate(() => {
      const sections = [];
      const tables = document.querySelectorAll("table");
      for (const table of tables) {
        let listType = null;
        const listTypeEl = table.previousElementSibling;
        if (listTypeEl) {
          const m = (listTypeEl.textContent || "").match(/(DAILY\s+LIST|MOTION\s+LIST|AFTER\s+MOTION\s+LIST|AFTER\s+ADJOURNED\s+MOTION\s+LIST)/i);
          if (m) listType = m[1].trim();
        }
        let headingText = "";
        let el = table.previousElementSibling;
        for (let i = 0; i < 5 && el; i++) {
          headingText = (el.textContent || "").trim() + " " + headingText;
          el = el.previousElementSibling;
        }
        const rows = [];
        for (const tr of table.querySelectorAll("tbody tr, tr")) {
          const cells = Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent || "").trim());
          rows.push({ cells });
        }
        sections.push({ listType, headingText, rows });
      }
      return sections;
    });

    let currentCourtNumber = null;
    let currentJudge = null;
    let currentHearingDate = null;
    let currentHearingTime = null;
    let currentHearingMode = null;
    let currentListType = null;
    let currentHearingCategory = null;
    const allHearings = [];

    for (const section of rawSections) {
      if (section.listType) currentListType = section.listType;
      const courtNum = parseCourtNumber(section.headingText);
      if (courtNum) currentCourtNumber = courtNum;
      const judge = parseJudgeName(section.headingText);
      if (judge) currentJudge = judge;
      const hDate = parseHearingDateFromHeading(section.headingText) || parseHearingDate(section.headingText);
      if (hDate) currentHearingDate = hDate;
      const hTime = parseHearingTime(section.headingText);
      if (hTime) currentHearingTime = hTime;
      const hMode = parseHearingMode(section.headingText);
      if (hMode) currentHearingMode = hMode;

      for (const { cells } of section.rows) {
        if (cells.length === 1) {
          const cat = cells[0];
          if (cat && !/^\d+$/.test(cat)) currentHearingCategory = cat;
          continue;
        }
        if (cells.length < 5) continue;

        const slNoRaw = cells[0] ?? "";
        const caseCol = cells[1] ?? "";
        const partyDetails = cells[2] ?? "";
        const petitionerAdvocate = (cells[3] ?? "").trim() || null;
        const respondentAdvocate = (cells[4] ?? "").trim() || null;
        const district = (cells[5] ?? "").trim() || null;

        const slNo = /^\d+$/.test(slNoRaw) ? parseInt(slNoRaw, 10) : null;
        const { caseNumber, interimApplications } = parseCaseColumn(caseCol);
        const { petitionerName, respondentName } = splitPartyDetails(partyDetails);

        const hearingDate = currentHearingDate || new Date();
        allHearings.push({
          slNo,
          caseNumber: caseNumber || "",
          interimApplications,
          petitionerName,
          respondentName,
          petitionerAdvocate,
          respondentAdvocate,
          district,
          courtNumber: currentCourtNumber ? `Court No. ${currentCourtNumber}` : null,
          judge: currentJudge,
          hearingDate,
          hearingTime: currentHearingTime,
          hearingMode: currentHearingMode,
          listType: currentListType,
          hearingCategory: currentHearingCategory,
        });
      }
    }

    const nameLower = advocateName.toLowerCase();
    const hearings = allHearings.filter(
      (h) =>
        (h.petitionerAdvocate && h.petitionerAdvocate.toLowerCase().includes(nameLower)) ||
        (h.respondentAdvocate && h.respondentAdvocate.toLowerCase().includes(nameLower))
    );

    return {
      advocateName,
      totalCases,
      causeListDate,
      hearings,
    };
  } catch (err) {
    throw new Error(`TSHC advocate cause list scrape failed: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// --- Standalone runner for testing ---
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tshcAdvocateWise.js");
if (isMain) {
  const name = process.argv[2] || "D NARENDAR NAIK";
  scrapeAdvocateCauseList(name)
    .then((data) => {
      console.log("Advocate:", data.advocateName);
      console.log("Total cases (page):", data.totalCases);
      console.log("Cause list date:", data.causeListDate);
      console.log("Filtered hearings:", data.hearings.length);
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
