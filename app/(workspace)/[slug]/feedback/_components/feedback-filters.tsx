"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  color: string;
  id: string;
  isArchived: boolean;
  name: string;
}

interface WorkspaceStatus {
  color: string;
  name: string;
  slug: string;
}

interface FeedbackFiltersProps {
  activeCategoryId: string;
  activeDraft: "all" | "only" | "published";
  activeSearch: string;
  activeSort: "newest" | "top" | "trending";
  activeStatus: string;
  categories: Category[];
  workspaceStatuses: WorkspaceStatus[];
}

const SORT_TABS = [
  { label: "Newest", value: "newest" },
  { label: "Trending", value: "trending" },
  { label: "Most Voted", value: "top" },
] as const;

export function FeedbackFilters({
  activeSort,
  activeStatus,
  activeCategoryId,
  activeDraft,
  activeSearch,
  workspaceStatuses,
  categories,
}: FeedbackFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "newest") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [router, pathname, searchParams]
  );

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateParam({ q: value || null });
    }, 300);
  }

  function clearSearch() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    updateParam({ q: null });
  }

  const activeCategories = categories.filter((c) => !c.isArchived);

  return (
    <div className="flex flex-col gap-0">
      {/* Sort + Board + Status + Category row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4">
        {/* Sort tabs */}
        <div className="flex">
          {SORT_TABS.map((tab) => (
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer duration-150 focus-visible:outline-none ${
                activeSort === tab.value
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              key={tab.value}
              onClick={() => updateParam({ sort: tab.value })}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category filter */}
          {activeCategories.length > 0 && (
            <Select
              onValueChange={(v) =>
                updateParam({ category: v === "all" ? null : v })
              }
              value={activeCategoryId || "all"}
            >
              <SelectTrigger
                className="text-xs text-muted-foreground"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter */}
          <Select
            onValueChange={(v) =>
              updateParam({ status: v === "all" ? null : v })
            }
            value={activeStatus || "all"}
          >
            <SelectTrigger className="text-xs text-muted-foreground" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {workspaceStatuses.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Draft filter */}
          <Select
            onValueChange={(v) =>
              updateParam({ draft: v === "all" ? null : v, page: null })
            }
            value={activeDraft}
          >
            <SelectTrigger className="text-xs text-muted-foreground" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All &amp; drafts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="only">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative border-b border-border">
        <Search className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          className="w-full bg-transparent py-2.5 pl-14 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          defaultValue={activeSearch}
          onChange={handleSearch}
          placeholder="Search feedback…"
          ref={searchInputRef}
          type="text"
        />
        {activeSearch && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
