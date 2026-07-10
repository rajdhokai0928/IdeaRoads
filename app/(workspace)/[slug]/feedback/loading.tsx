import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbackLoading() {
  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b border-ir-border px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-ir-button" />
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-ir-border px-4 py-4 sm:px-8">
        <Skeleton className="h-9 min-w-50 flex-1 rounded-ir-input" />
        <Skeleton className="h-9 w-28 rounded-ir-input" />
        <Skeleton className="h-9 w-28 rounded-ir-input" />
        <Skeleton className="h-9 w-28 rounded-ir-input" />
      </div>

      {/* Table */}
      <div className="px-4 py-6 sm:px-8">
        <div className="overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
          <div className="divide-y divide-ir-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                className="flex items-center gap-4 px-5 py-4"
                key={`feedback-row-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, order never changes
                  i
                }`}
              >
                <Skeleton className="h-4 w-8 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20 shrink-0" />
                <Skeleton className="h-5 w-16 shrink-0 rounded-ir-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
