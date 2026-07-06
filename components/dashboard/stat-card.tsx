import Link from "next/link";
import { ChangeIndicator } from "@/components/dashboard/change-indicator";

interface StatCardProps {
  href?: string;
  label: string;
  periodLabel?: string;
  previousValue?: number | null;
  value: number | string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  href,
  valueClassName,
  previousValue,
  periodLabel,
}: StatCardProps) {
  const showChange = previousValue != null && typeof value === "number";

  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums text-foreground ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {showChange && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <ChangeIndicator current={value as number} previous={previousValue} />
          {periodLabel && (
            <span className="text-2xs text-muted-foreground">
              vs {periodLabel}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (!href) {
    return (
      <div className="border border-border bg-background px-5 py-4">
        {content}
      </div>
    );
  }

  return (
    <Link
      className="block border border-border bg-background px-5 py-4 transition-colors duration-150 hover:border-foreground/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      href={href}
    >
      {content}
    </Link>
  );
}
