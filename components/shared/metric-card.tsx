import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  changePct?: number;
  changeLabel?: string;
  /** When true, an upward change is bad (e.g. cost, error rate). */
  invertColors?: boolean;
  icon?: React.ReactNode;
  accent?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}

const ACCENT: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function MetricCard({
  label,
  value,
  hint,
  changePct,
  changeLabel,
  invertColors,
  icon,
  accent = "default",
  className,
}: MetricCardProps) {
  let trendCls = "text-muted-foreground";
  let TrendIcon: React.ComponentType<{ className?: string }> = Minus;
  if (typeof changePct === "number") {
    const goodWhenUp = !invertColors;
    const positive = changePct > 0;
    const negative = changePct < 0;
    if (positive) {
      trendCls = goodWhenUp ? "text-success" : "text-destructive";
      TrendIcon = ArrowUpRight;
    } else if (negative) {
      trendCls = goodWhenUp ? "text-destructive" : "text-success";
      TrendIcon = ArrowDownRight;
    }
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          {icon ? (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                ACCENT[accent],
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="flex items-center gap-2 text-xs">
            {typeof changePct === "number" ? (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", trendCls)}>
                <TrendIcon className="h-3 w-3" />
                {changePct > 0 ? "+" : ""}
                {changePct.toFixed(1)}%
              </span>
            ) : null}
            {(changeLabel || hint) && (
              <span className="text-muted-foreground">{changeLabel ?? hint}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
