import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard.jsx";
import HearingsPage from "./pages/Hearings.jsx";
import CalendarPage from "./pages/Calendar.jsx";
import ScrapeControlPage from "./pages/ScrapeControl.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hearings" element={<HearingsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/scrape" element={<ScrapeControlPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

