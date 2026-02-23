import { useHearings } from "../../hooks/useHearings.js";
import { useCauseListStatus } from "../../hooks/useCauseListStatus.js";
import { Card, CardContent, CardTitle } from "../ui/card.jsx";
import { Skeleton } from "../ui/skeleton.jsx";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function StatsBar() {
  const date = todayISO();
  const { data: hearingsData, isLoading: hearingsLoading } = useHearings({
    date
  });
  const { data: clsData, isLoading: clsLoading } = useCauseListStatus({
    date
  });

  const hearings = hearingsData?.hearings || [];
  const liveStatuses = clsData?.liveStatuses || [];

  const totalHearings = hearings.length;
  const courtsUploaded = liveStatuses.filter((r) => r.status === "UPLOADED")
    .length;
  const courtsOnLeave = liveStatuses.filter((r) => r.status === "ON LEAVE")
    .length;
  const pending = liveStatuses.filter((r) => r.status === "NOT UPLOADED")
    .length;

  const loading = hearingsLoading || clsLoading;

  const items = [
    { label: "Total hearings today", value: totalHearings },
    { label: "Courts uploaded", value: courtsUploaded },
    { label: "Courts on leave", value: courtsOnLeave },
    { label: "Pending courts", value: pending }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-white">
          <CardContent className="py-3">
            <CardTitle className="text-xs text-slate-500">
              {item.label}
            </CardTitle>
            {loading ? (
              <Skeleton className="mt-2 h-6 w-16" />
            ) : (
              <div className="mt-2 text-2xl font-semibold">
                {item.value ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

