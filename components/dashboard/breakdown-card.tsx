import { TrendingDown, TrendingUp } from "lucide-react";
import { ParamSelect } from "@/components/dashboard/param-select";
import type {
  BreakdownMetrics,
  BreakdownPeriod,
} from "@/lib/dashboard/queries";

interface BreakdownCardProps {
  metrics: BreakdownMetrics;
  period: BreakdownPeriod;
}

const PERIOD_OPTIONS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
];

function ChangeIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  if (previous === null) {
    return null;
  }

  if (previous === 0) {
    return current === 0 ? (
      <span className="text-xs text-muted-foreground">—</span>
    ) : (
      <span className="text-xs font-medium text-success">New</span>
    );
  }

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return <span className="text-xs text-muted-foreground">0%</span>;
  }

  const isUp = pct > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-success" : "text-destructive"}`}
    >
      <Icon className="size-3" />
      {isUp ? "+" : ""}
      {pct}%
    </span>
  );
}

export function BreakdownCard({ metrics, period }: BreakdownCardProps) {
  const rows: { label: string; value: number; previous: number | null }[] = [
    {
      label: "New feedback",
      value: metrics.newFeedback,
      previous: metrics.previous?.newFeedback ?? null,
    },
    {
      label: "Total upvotes",
      value: metrics.totalUpvotes,
      previous: metrics.previous?.totalUpvotes ?? null,
    },
    {
      label: "New comments",
      value: metrics.newComments,
      previous: metrics.previous?.newComments ?? null,
    },
    {
      label: "Active users",
      value: metrics.activeUsers,
      previous: metrics.previous?.activeUsers ?? null,
    },
  ];

  return (
    <div className="border border-border bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Breakdown</h2>
        <ParamSelect
          options={PERIOD_OPTIONS}
          paramName="period"
          value={period}
        />
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            className="flex items-center justify-between gap-4 px-5 py-3.5"
            key={row.label}
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {row.value.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">{row.label}</span>
            </div>
            <ChangeIndicator current={row.value} previous={row.previous} />
          </div>
        ))}
      </div>
    </div>
  );
}
