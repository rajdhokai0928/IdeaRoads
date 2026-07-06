"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";

interface Category {
  color: string;
  id: string;
  isArchived: boolean;
  name: string;
}

interface RoadmapFiltersProps {
  activeCategoryId: string;
  activeSearch: string;
  activeSort: "votes" | "latest_status_change";
  categories: Category[];
}

const SORT_OPTIONS = [
  { label: "Most votes", value: "votes" },
  { label: "Latest status change", value: "latest_status_change" },
] as const;

export function RoadmapFilters({
  activeCategoryId,
  activeSearch,
  activeSort,
  categories,
}: RoadmapFiltersProps) {
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
        if (value === null || value === "" || value === "votes") {
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
  const pillSelect =
    "h-9 cursor-pointer border border-border bg-background pl-3 pr-7 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-4 sm:px-8">
      {/* Search */}
      <div className="relative min-w-50 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-9 w-full border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={activeSearch}
          onChange={handleSearch}
          placeholder="Search"
          ref={searchInputRef}
          type="text"
        />
        {activeSearch && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {activeCategories.length > 0 && (
          <select
            className={pillSelect}
            onChange={(e) => updateParam({ category: e.target.value || null })}
            value={activeCategoryId}
          >
            <option value="">All items</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <select
          className={pillSelect}
          onChange={(e) => updateParam({ sort: e.target.value })}
          value={activeSort}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
