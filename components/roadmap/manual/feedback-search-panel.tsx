"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { searchRoadmapFeedbackAction } from "@/app/actions/roadmap";
import { SearchInput } from "@/components/ui/search-input";
import type { FeedbackSearchResult } from "@/lib/roadmap/manual";

interface FeedbackSearchPanelProps {
  onFill: (postId: string) => void;
  workspaceId: string;
}

// Feedback bodies may be rich-text HTML; show a plain-text preview.
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function FeedbackSearchPanel({
  workspaceId,
  onFill,
}: FeedbackSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeedbackSearchResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  // Guards against out-of-order responses clobbering a newer query's results.
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    (q: string, offset: number) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      startTransition(async () => {
        const res = await searchRoadmapFeedbackAction({
          workspaceId,
          query: q || undefined,
          offset,
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        setLoading(false);
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        setHasMore(res.data.hasMore);
        setResults((prev) =>
          offset === 0 ? res.data.results : [...prev, ...res.data.results]
        );
      });
    },
    [workspaceId]
  );

  // Initial load + re-run whenever the (debounced) query changes.
  useEffect(() => {
    runSearch(query, 0);
  }, [query, runSearch]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fill from feedback
        </p>
        <SearchInput
          aria-label="Search feedback"
          debounceMs={250}
          onSearch={setQuery}
          placeholder="Search title, description, category…"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && results.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {query
                ? `No feedback matches “${query}”.`
                : "No feedback found in this workspace."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <div
                className="border border-border bg-background p-3"
                key={r.id}
              >
                <p className="text-sm font-medium leading-snug text-foreground">
                  {r.title}
                </p>
                {r.description && htmlToText(r.description) && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {htmlToText(r.description)}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span aria-hidden>▲</span>
                    {r.upvotes}
                  </span>
                  {r.commentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {r.commentCount}
                    </span>
                  )}
                  <span className="capitalize">
                    {r.status.replace(/_/g, " ")}
                  </span>
                  {r.categoryName && r.categoryColor && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5"
                      style={{
                        backgroundColor: `${r.categoryColor}18`,
                        color: r.categoryColor,
                      }}
                    >
                      {r.categoryName}
                    </span>
                  )}
                  {r.authorName && <span>· {r.authorName}</span>}
                  <span>
                    ·{" "}
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <button
                  className="mt-2.5 w-full border border-border px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onFill(r.id)}
                  type="button"
                >
                  Fill from Feedback
                </button>
              </div>
            ))}

            {hasMore && (
              <button
                className="w-full border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
                onClick={() => runSearch(query, results.length)}
                type="button"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
