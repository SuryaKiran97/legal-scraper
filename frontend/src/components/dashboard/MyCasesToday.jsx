import { useHearings } from "../../hooks/useHearings.js";
import { formatTime } from "../../lib/utils.js";
import { Badge } from "../ui/badge.jsx";
import { Skeleton } from "../ui/skeleton.jsx";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_ADVOCATE = "D NARENDAR NAIK";

export function MyCasesToday({ onSelect }) {
  const date = todayISO();
  const { data, isLoading } = useHearings({
    date,
    advocateName: DEFAULT_ADVOCATE
  });
  const hearings = data?.hearings || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">My Cases Today</div>
        <div className="text-xs text-slate-500">
          Advocate: <span className="font-medium">{DEFAULT_ADVOCATE}</span>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="max-h-[28rem] overflow-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : hearings.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No hearings found for today.
            </div>
          ) : (
            hearings.map((h) => {
              const shortCourt = h.courtNumber
                ? h.courtNumber.replace(/COURT\\s*NO\\.?\\s*/i, "")
                : "";
              const role =
                (h.petitionerAdvocate || "").includes(DEFAULT_ADVOCATE)
                  ? "Petitioner"
                  : (h.respondentAdvocate || "").includes(DEFAULT_ADVOCATE)
                  ? "Respondent"
                  : "";
              return (
                <button
                  key={h.id}
                  className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  type="button"
                  onClick={() => onSelect?.(h)}
                >
                  <div>
                    <div className="font-medium">{h.caseNumber}</div>
                    <div className="text-xs text-slate-500">
                      Court {shortCourt} • {h.hearingTime || formatTime(h.hearingDate)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="blue" className="text-[10px]">
                      {h.listType}
                    </Badge>
                    {role && (
                      <span className="text-[11px] text-slate-600">{role}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

