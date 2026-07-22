"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { searchPostsForChangelogAction } from "@/app/actions/changelog";

interface Post {
  boardName: string;
  boardSlug: string;
  id: string;
  slug: string;
  status: string;
  title: string;
  upvotes: number;
}

interface LinkedPostsSelectorProps {
  onChange: (posts: Post[]) => void;
  selectedPosts: Post[];
  workspaceId: string;
}

export function LinkedPostsSelector({
  workspaceId,
  selectedPosts,
  onChange,
}: LinkedPostsSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selectedPosts.map((p) => p.id));

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          const result = await searchPostsForChangelogAction({
            workspaceId,
            query: q,
          });
          if (result.success) {
            setResults(result.data.filter((p) => !selectedIds.has(p.id)));
          }
        });
      }, 250);
    },
    [workspaceId, selectedIds]
  );

  useEffect(() => {
    if (isOpen) {
      search(query);
    }
  }, [query, isOpen, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addPost(post: Post) {
    if (selectedPosts.length >= 20) {
      return;
    }
    onChange([...selectedPosts, post]);
    setQuery("");
    setIsOpen(false);
  }

  function removePost(postId: string) {
    onChange(selectedPosts.filter((p) => p.id !== postId));
  }

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selectedPosts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPosts.map((post) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-ir-sm border border-ir-border bg-ir-muted-surface px-2 py-1 text-xs font-medium text-ir-heading"
              key={post.id}
            >
              <span className="max-w-50 truncate">{post.title}</span>
              <button
                aria-label={`Remove ${post.title}`}
                className="cursor-pointer text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none"
                onClick={() => removePost(post.id)}
                type="button"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {selectedPosts.length < 20 && (
        <div className="relative" ref={containerRef}>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ir-muted" />
            <input
              className="w-full rounded-ir-input border border-ir-border bg-ir-surface py-2 pr-3 pl-9 text-sm text-ir-body placeholder:text-ir-muted focus:ring-2 focus:ring-ir-primary/40 focus:outline-none"
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search posts to link…"
              type="text"
              value={query}
            />
          </div>

          {/* Dropdown */}
          {isOpen && results.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-ir-md border border-ir-border bg-ir-surface shadow-ir-lg">
              {results.map((post) => (
                <button
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface focus-visible:bg-ir-muted-surface focus-visible:outline-none"
                  key={post.id}
                  onClick={() => addPost(post)}
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ir-heading">
                      {post.title}
                    </span>
                    <span className="block truncate text-xs text-ir-muted">
                      {post.boardName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-ir-muted">
                    ↑ {post.upvotes}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isOpen && query && results.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-ir-md border border-ir-border bg-ir-surface shadow-ir-lg">
              <p className="px-3 py-3 text-sm text-ir-muted">No posts found.</p>
            </div>
          )}
        </div>
      )}

      {selectedPosts.length >= 20 && (
        <p className="text-xs text-ir-muted">
          Maximum 20 linked posts reached.
        </p>
      )}
    </div>
  );
}
