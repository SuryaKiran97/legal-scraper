/**
 * Example court hearing scraper template.
 * Replace with real selectors and logic for your target court site.
 *
 * Usage: run(scrapeLogId, courtConfig) from a BullMQ job.
 */

/**
 * @param {object} options
 * @param {string} options.scrapeLogId - ScrapeLog record id for this run
 * @param {object} options.court - Court record (id, name, code, url, ...)
 * @param {object} options.prisma - PrismaClient instance
 * @returns {Promise<{ count: number, error?: string }>}
 */
export async function run({ scrapeLogId, court, prisma }) {
  // 1. Fetch the court's hearings page (use axios/node-fetch/playwright as needed)
  // const response = await fetch(court.url);
  // const html = await response.text();

  // 2. Parse HTML (e.g. cheerio, jsdom) and extract hearing rows
  // const $ = cheerio.load(html);
  // const rows = $('table.hearings tr');

  // 3. Map rows to { caseNumber, caseTitle, hearingDate, hearingType, room, judge, status }
  const mockHearings = [
    {
      caseNumber: "EXAMPLE-001",
      caseTitle: "Sample v. Defendant",
      hearingDate: new Date(),
      hearingType: "Motion",
      room: "101",
      judge: "Judge Smith",
      status: "scheduled",
      rawData: {},
    },
  ];

  let count = 0;
  try {
    for (const h of mockHearings) {
      await prisma.hearing.upsert({
        where: {
          courtId_caseNumber_hearingDate: {
            courtId: court.id,
            caseNumber: h.caseNumber,
            hearingDate: h.hearingDate,
          },
        },
        create: {
          courtId: court.id,
          caseNumber: h.caseNumber,
          caseTitle: h.caseTitle,
          hearingDate: h.hearingDate,
          hearingType: h.hearingType,
          room: h.room,
          judge: h.judge,
          status: h.status,
          rawData: h.rawData ?? {},
        },
        update: {
          caseTitle: h.caseTitle,
          hearingType: h.hearingType,
          room: h.room,
          judge: h.judge,
          status: h.status,
          rawData: h.rawData ?? {},
        },
      });
      count++;
    }

    await prisma.scrapeLog.update({
      where: { id: scrapeLogId },
      data: {
        completedAt: new Date(),
        status: "completed",
        recordsScraped: count,
      },
    });

    return { count };
  } catch (err) {
    await prisma.scrapeLog.update({
      where: { id: scrapeLogId },
      data: {
        completedAt: new Date(),
        status: "failed",
        errorMessage: err.message,
        recordsScraped: count,
      },
    });
    return { count, error: err.message };
  }
}
