import { cn } from "../../lib/utils.js";

export function Button({ className, variant = "default", size = "md", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-accent text-black hover:bg-amber-400",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-800",
    outline: "border border-slate-300 text-slate-900 hover:bg-slate-50"
  };
  const sizes = {
    sm: "h-8 px-2",
    md: "h-9 px-3",
    lg: "h-10 px-4"
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

