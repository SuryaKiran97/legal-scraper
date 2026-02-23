import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  CalendarDays,
  RefreshCw,
  Scale
} from "lucide-react";
import { cn } from "../../lib/utils.js";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hearings", label: "Hearings", icon: List },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/scrape", label: "Scrape Control", icon: RefreshCw }
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-slate-100 lg:static fixed inset-y-0">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sidebar">
          <Scale size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">LawClerk</div>
          <div className="text-xs text-slate-300">Case Management</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/60",
                  isActive && "border-l-4 border-accent bg-slate-800 text-accent"
                )
              }
            >
              <Icon size={18} />
              <span className="hidden md:inline">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

