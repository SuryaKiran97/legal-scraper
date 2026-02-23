import { useState } from "react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { useScrapeLogs } from "../hooks/useScrapeLogs.js";
import { api } from "../lib/axios.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "../lib/utils.js";
import { Badge } from "../components/ui/badge.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";

const DEFAULT_ADVOCATE = "D NARENDAR NAIK";

function durationMs(log) {
  if (!log.completedAt || !log.startedAt) return null;
  const ms = new Date(log.completedAt) - new Date(log.startedAt);
  return ms;
}

function formatDuration(ms) {
  if (ms == null) return "-";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function ScrapeControlPage() {
  const [advocate, setAdvocate] = useState(DEFAULT_ADVOCATE);
  const queryClient = useQueryClient();
  const { data, isLoading } = useScrapeLogs(50);
  const logs = data?.logs || [];

  const liveMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/scrape/tshc-live-status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrape-logs"] });
    }
  });

  const advocateMutation = useMutation({
    mutationFn: async (name) => {
      await api.post(`/api/scrape/tshc-advocate/${encodeURIComponent(name)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrape-logs"] });
      queryClient.invalidateQueries({ queryKey: ["hearings"] });
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold">Scrape Live Status</div>
          <p className="text-xs text-slate-500">
            Trigger the live-status scraper for all court halls.
          </p>
          <Button
            onClick={() => liveMutation.mutate()}
            disabled={liveMutation.isPending}
          >
            {liveMutation.isPending ? "Queuing..." : "Scrape Live Status"}
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold">Scrape by Advocate</div>
          <p className="text-xs text-slate-500">
            Queue a scrape for all current cases for a specific advocate.
          </p>
          <div className="flex gap-2">
            <Input
              value={advocate}
              onChange={(e) => setAdvocate(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => advocateMutation.mutate(advocate)}
              disabled={advocateMutation.isPending || !advocate.trim()}
            >
              {advocateMutation.isPending ? "Queuing..." : "Scrape"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Scrape Logs</div>
        <p className="text-xs text-slate-500 mb-2">
          Most recent scrape runs. Updates every 10 seconds.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Court
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Started
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Completed
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Duration
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Records
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  Error
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : logs.map((log) => {
                    let variant = "default";
                    if (log.status === "completed") variant = "success";
                    else if (log.status === "failed") variant = "danger";
                    else if (log.status === "running") variant = "warning";
                    return (
                      <tr key={log.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-xs">
                          {log.court?.name} ({log.court?.code})
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {formatDateTime(log.startedAt)}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {log.completedAt
                            ? formatDateTime(log.completedAt)
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {formatDuration(durationMs(log))}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <Badge variant={variant}>{log.status}</Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {log.recordsScraped}
                        </td>
                        <td className="px-3 py-2 text-xs text-red-600">
                          {log.errorMessage
                            ? log.errorMessage.slice(0, 40)
                            : ""}
                        </td>
                      </tr>
                    );
                  })}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-sm text-slate-500"
                  >
                    No scrape history yet — trigger your first scrape above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

