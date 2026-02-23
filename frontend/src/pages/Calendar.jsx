import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useHearings } from "../hooks/useHearings.js";
import { useState, useMemo } from "react";
import { Input } from "../components/ui/input.jsx";
import { formatDate } from "../lib/utils.js";
import { HearingDetailPanel } from "../components/hearings/HearingDetailPanel.jsx";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function listTypeColor(listType) {
  if (listType === "MOTION LIST") return "#f97316";
  if (listType === "AFTER MOTION LIST") return "#8b5cf6";
  if (listType === "AFTER ADJOURNED MOTION LIST") return "#6b7280";
  return "#3b82f6";
}

export default function CalendarPage() {
  const [filters, setFilters] = useState({ date: todayISO() });
  const [selected, setSelected] = useState(null);
  const { data } = useHearings(filters);
  const hearings = data?.hearings || [];

  const events = useMemo(
    () =>
      hearings.map((h) => ({
        id: h.id,
        title: `${h.caseNumber} | Court ${
          (h.courtNumber || "").replace(/COURT\\s*NO\\.?\\s*/i, "") || "-"
        }`,
        date: h.hearingDate,
        backgroundColor: listTypeColor(h.listType),
        borderColor: listTypeColor(h.listType),
        extendedProps: h
      })),
    [hearings]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">Date</label>
          <Input
            type="date"
            value={filters.date || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, date: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">Advocate</label>
          <Input
            placeholder="Filter by advocate name"
            value={filters.advocateName || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                advocateName: e.target.value || undefined
              }))
            }
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing {events.length} events on {formatDate(filters.date)}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          height="auto"
          events={events}
          eventClick={(info) => setSelected(info.event.extendedProps)}
        />
      </div>

      <HearingDetailPanel hearing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

