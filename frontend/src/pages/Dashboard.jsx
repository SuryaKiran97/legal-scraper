import { useState } from "react";
import { StatsBar } from "../components/dashboard/StatsBar.jsx";
import { CourtStatusTable } from "../components/dashboard/CourtStatusTable.jsx";
import { MyCasesToday } from "../components/dashboard/MyCasesToday.jsx";
import { HearingDetailPanel } from "../components/hearings/HearingDetailPanel.jsx";

export default function Dashboard() {
  const [selectedHearing, setSelectedHearing] = useState(null);

  return (
    <div className="space-y-4">
      <StatsBar />
      <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        <CourtStatusTable
          onViewCourt={(courtHallNo) => {
            // Future: navigate to Hearings with filters using courtHallNo
            console.info("View court", courtHallNo);
          }}
        />
        <MyCasesToday onSelect={(h) => setSelectedHearing(h)} />
      </div>
      <HearingDetailPanel
        hearing={selectedHearing}
        onClose={() => setSelectedHearing(null)}
      />
    </div>
  );
}

