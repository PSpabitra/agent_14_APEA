import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "danger" | "warning" | "success" | "info";
}

const TONE_BORDER: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "",
  danger: "border-danger/40",
  warning: "border-warning/40",
  success: "border-success/40",
  info: "border-info/40",
};

const TONE_ICON: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-primary bg-primary/15",
  danger: "text-danger bg-danger/15",
  warning: "text-warning bg-warning/15",
  success: "text-success bg-success/15",
  info: "text-info bg-info/15",
};

export function StatCard({ label, value, hint, icon, tone = "default" }: StatCardProps) {
  return (
    <div className={cn("card p-5 flex items-start gap-4", TONE_BORDER[tone])}>
      {icon && (
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", TONE_ICON[tone])}>{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-subtext">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text truncate">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-subtext">{hint}</p>}
      </div>
    </div>
  );
}
