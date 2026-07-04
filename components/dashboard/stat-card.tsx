import Link from "next/link";

interface StatCardProps {
  href?: string;
  label: string;
  value: number | string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  href,
  valueClassName,
}: StatCardProps) {
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
