import { TrendingDown, TrendingUp } from "lucide-react";

export function ChangeIndicator({
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
