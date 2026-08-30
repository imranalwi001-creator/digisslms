import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatPillProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatPill({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  className,
}: StatPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 text-card-foreground shadow-xs transition-all duration-200 hover:border-primary/30",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <p className="font-mono text-xl font-bold tracking-tight text-foreground">{value}</p>
          {subValue && (
            <span className="text-[11px] font-mono text-muted-foreground">{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
