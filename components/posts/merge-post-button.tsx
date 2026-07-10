"use client";

import { GitMergeIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { mergePostAction, searchMergeTargetsAction } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";

interface MergeTarget {
  id: string;
  title: string;
  upvotes: number;
}

interface MergePostButtonProps {
  postId: string;
  postTitle: string;
  workspaceId: string;
}

export default function MergePostButton({
  postId,
  postTitle,
  workspaceId,
}: MergePostButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MergeTarget[]>([]);
  const [selected, setSelected] = useState<MergeTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function search(q: string) {
    startTransition(async () => {
      const result = await searchMergeTargetsAction({
        workspaceId,
        query: q,
        excludePostId: postId,
      });
      if (result.success) {
        setResults(result.data.posts);
      }
    });
  }

  function runSearch(q: string) {
    setQuery(q);
    setSelected(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => search(q), 250);
  }

  function handleMerge() {
    if (!selected) {
      return;
    }
    startTransition(async () => {
      const result = await mergePostAction({
        sourceId: postId,
        targetId: selected.id,
        workspaceId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Post merged");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="flex items-center gap-1.5 text-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:opacity-50"
        disabled={isPending}
        onClick={() => {
          setOpen((v) => !v);
          if (!open && results.length === 0) {
            search("");
          }
        }}
        type="button"
      >
        <GitMergeIcon className="size-3.5" />
        Merge
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-80 space-y-2 rounded-ir-md border border-ir-border bg-ir-surface p-3 shadow-ir-lg">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ir-muted">
            Merge into another post
          </p>
          <input
            className="w-full rounded-ir-input border border-ir-border bg-ir-surface px-3 py-2 text-sm text-ir-body placeholder:text-ir-muted focus:outline-none focus:ring-2 focus:ring-ir-primary/40"
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search posts…"
            type="text"
            value={query}
          />

          <div className="max-h-56 divide-y divide-ir-border overflow-y-auto rounded-ir-md border border-ir-border">
            {results.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ir-muted">
                No matching posts.
              </p>
            ) : (
              results.map((r) => (
                <button
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors duration-150 ease-ir-standard focus-visible:outline-none ${
                    selected?.id === r.id
                      ? "bg-ir-primary-light/20 text-ir-primary"
                      : "text-ir-body hover:bg-ir-muted-surface"
                  }`}
                  key={r.id}
                  onClick={() => setSelected(r)}
                  type="button"
                >
                  <span className="line-clamp-1">{r.title}</span>
                  <span className="text-2xs text-ir-muted">↑ {r.upvotes}</span>
                </button>
              ))
            )}
          </div>

          {selected && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-ir-muted">
                Merge{" "}
                <span className="font-medium text-ir-heading">
                  "{postTitle}"
                </span>{" "}
                into{" "}
                <span className="font-medium text-ir-heading">
                  "{selected.title}"
                </span>
                ? Votes transfer to the target and this post is locked.
              </p>
              <div className="flex items-center gap-2">
                <Button disabled={isPending} onClick={handleMerge} size="sm">
                  {isPending ? "Merging…" : "Merge"}
                </Button>
                <Button
                  onClick={() => setSelected(null)}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
