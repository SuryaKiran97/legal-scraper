import { useState, useMemo } from "react";
import { useHearings } from "../hooks/useHearings.js";
import { useReactTable, getCoreRowModel, getSortedRowModel } from "@tanstack/react-table";
import { formatDate } from "../lib/utils.js";
import { Input } from "../components/ui/input.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { HearingDetailPanel } from "../components/hearings/HearingDetailPanel.jsx";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function HearingsPage() {
  const [filters, setFilters] = useState({ date: todayISO() });
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useHearings(filters);
  const hearings = data?.hearings || [];

  const columns = useMemo(
    () => [
      {
        header: "Sl.No",
        accessorKey: "slNo"
      },
      {
        header: "Case Number",
        accessorKey: "caseNumber",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => setSelected(row.original)}
          >
            {row.original.caseNumber}
          </button>
        )
      },
      {
        header: "Parties",
        accessorFn: (row) =>
          `${row.petitionerName || ""} vs ${row.respondentName || ""}`
      },
      {
        header: "Court",
        accessorKey: "courtNumber",
        cell: ({ row }) => {
          const judge = row.original.judge || "";
          const shortJudge = judge.replace(
            /THE\\s+HONOURABLE\\s+SRI\\s+JUSTICE\\s+/i,
            ""
          );
          return (
            <div className="text-xs">
              <div className="font-medium">{row.original.courtNumber}</div>
              <div className="text-slate-500">{shortJudge}</div>
            </div>
          );
        }
      },
      {
        header: "List Type",
        accessorKey: "listType",
        cell: ({ row }) => {
          const lt = row.original.listType;
          let variant = "blue";
          if (lt === "MOTION LIST") variant = "warning";
          else if (lt === "AFTER MOTION LIST") variant = "purple";
          else if (lt === "AFTER ADJOURNED MOTION LIST") variant = "default";
          return <Badge variant={variant}>{lt}</Badge>;
        }
      },
      {
        header: "Category",
        accessorKey: "hearingCategory"
      },
      {
        header: "Petitioner Adv.",
        accessorKey: "petitionerAdvocate"
      },
      {
        header: "Respondent Adv.",
        accessorKey: "respondentAdvocate",
        cell: ({ row }) => {
          const adv = row.original.respondentAdvocate || "";
          const highlight = adv.includes("D NARENDAR NAIK");
          return (
            <span
              className={
                highlight ? "bg-amber-100 px-1 py-0.5 rounded" : undefined
              }
            >
              {adv}
            </span>
          );
        }
      },
      {
        header: "District",
        accessorKey: "district"
      },
      {
        header: "Hearing Date",
        accessorKey: "hearingDate",
        cell: ({ row }) => formatDate(row.original.hearingDate)
      },
      {
        header: "Scraped",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return d.toTimeString().slice(0, 5);
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: hearings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">Date</label>
          <Input
            type="date"
            value={filters.date || ""}
            onChange={(e) => onFilterChange("date", e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">Court number</label>
          <Input
            placeholder="e.g. 14"
            value={filters.courtNumber || ""}
            onChange={(e) => onFilterChange("courtNumber", e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">List type</label>
          <Select
            value={filters.listType || ""}
            onChange={(e) => onFilterChange("listType", e.target.value)}
          >
            <option value="">All</option>
            <option value="DAILY LIST">DAILY LIST</option>
            <option value="MOTION LIST">MOTION LIST</option>
            <option value="AFTER MOTION LIST">AFTER MOTION LIST</option>
            <option value="AFTER ADJOURNED MOTION LIST">
              AFTER ADJOURNED MOTION LIST
            </option>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">Advocate</label>
          <Input
            placeholder="Search advocate"
            value={filters.advocateName || ""}
            onChange={(e) => onFilterChange("advocateName", e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-slate-600">Case number</label>
          <Input
            placeholder="WP/..."
            value={filters.caseNumber || ""}
            onChange={(e) => onFilterChange("caseNumber", e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters({ date: todayISO() })}
        >
          Reset
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-semibold text-slate-600"
                  >
                    {header.column.columnDef.header}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {columns.map((col) => (
                      <td key={col.header} className="px-3 py-2">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-top">
                        {cell.getValue()}
                      </td>
                    ))}
                  </tr>
                ))}
            {!isLoading && hearings.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-4 text-center text-sm text-slate-500"
                >
                  No hearings found — adjust filters or trigger a scrape.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <HearingDetailPanel hearing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

