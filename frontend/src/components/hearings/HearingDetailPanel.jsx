import { formatDate, formatDateTime } from "../../lib/utils.js";
import { Badge } from "../ui/badge.jsx";

export function HearingDetailPanel({ hearing, onClose }) {
  if (!hearing) return null;

  const modeVariant =
    hearing.hearingMode && hearing.hearingMode.toUpperCase().includes("HYBRID")
      ? "blue"
      : "default";

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {hearing.caseNumber}
          </div>
          {hearing.caseTitle && (
            <div className="text-xs text-slate-500">{hearing.caseTitle}</div>
          )}
        </div>
        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-800"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="max-h-[calc(100vh-3rem)] space-y-4 overflow-auto px-4 py-4 text-sm">
        {Array.isArray(hearing.interimApplications) &&
          hearing.interimApplications.length > 0 && (
            <section>
              <div className="mb-1 text-xs font-semibold text-slate-500">
                Interim Applications
              </div>
              <div className="flex flex-wrap gap-1">
                {hearing.interimApplications.map((ia) => (
                  <Badge
                    key={ia.id}
                    variant="outline"
                    title={ia.iaType || ""}
                    className="border-slate-300 bg-slate-50 text-[11px]"
                  >
                    {ia.iaNumber}
                  </Badge>
                ))}
              </div>
            </section>
          )}

        <section>
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Parties
          </div>
          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
            <div>
              <span className="text-xs font-medium text-slate-600">
                Petitioner:
              </span>{" "}
              <span>{hearing.petitionerName}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Respondent:
              </span>{" "}
              <span>{hearing.respondentName}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Advocates
          </div>
          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
            <div>
              <span className="text-xs font-medium text-slate-600">
                Petitioner:
              </span>{" "}
              <span>{hearing.petitionerAdvocate}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Respondent:
              </span>{" "}
              <span>{hearing.respondentAdvocate}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Hearing details
          </div>
          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
            <div>
              <span className="text-xs font-medium text-slate-600">
                Court:
              </span>{" "}
              <span>{hearing.courtNumber}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Judge:
              </span>{" "}
              <span>{hearing.judge}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Date:
              </span>{" "}
              <span>{formatDate(hearing.hearingDate)}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Time:
              </span>{" "}
              <span>{hearing.hearingTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Mode:</span>
              <Badge variant={modeVariant}>{hearing.hearingMode}</Badge>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                List Type:
              </span>{" "}
              <span>{hearing.listType}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Category:
              </span>{" "}
              <span>{hearing.hearingCategory}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Additional
          </div>
          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
            <div>
              <span className="text-xs font-medium text-slate-600">
                District:
              </span>{" "}
              <span>{hearing.district}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">
                Status:
              </span>{" "}
              <span>{hearing.status}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Raw data
          </div>
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-2 text-[11px] text-slate-50">
            {JSON.stringify(hearing.rawData ?? {}, null, 2)}
          </pre>
          <div className="text-[11px] text-slate-500">
            Scraped: {formatDateTime(hearing.createdAt)}
          </div>
        </section>
      </div>
    </div>
  );
}

