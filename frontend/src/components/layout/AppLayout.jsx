import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

