import { cn } from "../../lib/utils.js";

export function Badge({ className, variant = "default", ...props }) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  const variants = {
    default: "border-slate-200 bg-slate-100 text-slate-800",
    success: "border-emerald-200 bg-emerald-100 text-emerald-800",
    danger: "border-red-200 bg-red-100 text-red-800",
    warning: "border-amber-200 bg-amber-100 text-amber-800",
    blue: "border-blue-200 bg-blue-100 text-blue-800",
    purple: "border-purple-200 bg-purple-100 text-purple-800"
  };
  return (
    <span className={cn(base, variants[variant], className)} {...props} />
  );
}

