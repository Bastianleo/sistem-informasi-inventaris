import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  accent?: "default" | "destructive" | "warning" | "success";
}

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  success: "bg-success/10 text-success",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  accent = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.direction === "up" && "text-success",
                trend.direction === "down" && "text-destructive",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accentMap[accent]
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
