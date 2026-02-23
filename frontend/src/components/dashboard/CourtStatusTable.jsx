import { useCauseListStatus } from "../../hooks/useCauseListStatus.js";
import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";
import { Skeleton } from "../ui/skeleton.jsx";
import { api } from "../../lib/axios.js";
import { formatDateTime } from "../../lib/utils.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function CourtStatusTable({ onViewCourt }) {
  const date = todayISO();
  const queryClient = useQueryClient();
  const [lastScraped, setLastScraped] = useState(null);

  const { data, isLoading } = useCauseListStatus({ date });
  const rows = data?.liveStatuses || [];

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/scrape/tshc-live-status");
    },
    onSuccess: () => {
      setLastScraped(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ["cause-list-status"] });
      queryClient.invalidateQueries({ queryKey: ["scrape-logs"] });
    }
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Today&apos;s Court Status</div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            Last scraped:{" "}
            {lastScraped
              ? formatDateTime(lastScraped)
              : "Trigger a scrape to populate"}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={refreshMutation.isPending}
            onClick={() => refreshMutation.mutate()}
          >
            {refreshMutation.isPending ? "Refreshing..." : "Refresh now"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Court Hall
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Bench
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                List Type
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Status
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">
                Uploaded At
              </th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-2">
                      <Skeleton className="h-8 w-16" />
                    </td>
                  </tr>
                ))
              : rows.map((row) => {
                  let badgeVariant = "default";
                  if (row.status === "UPLOADED") badgeVariant = "success";
                  else if (row.status === "ON LEAVE") badgeVariant = "danger";
                  else if (row.status === "NOT UPLOADED")
                    badgeVariant = "warning";
                  return (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-sm font-medium">
                        {row.courtHallNo}
                      </td>
                      <td className="px-3 py-2 text-sm">{row.benchName}</td>
                      <td className="px-3 py-2 text-sm">{row.listType}</td>
                      <td className="px-3 py-2 text-sm">
                        <Badge variant={badgeVariant}>{row.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.uploadedAt ? formatDateTime(row.uploadedAt) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.status === "UPLOADED" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              onViewCourt?.(row.courtHallNo, row.benchName)
                            }
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-sm text-slate-500"
                >
                  No live status found for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

