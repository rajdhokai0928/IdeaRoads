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
          <Select
            onValueChange={(v) =>
              updateParam({ category: v === "all" ? null : v })
            }
            value={activeCategoryId || "all"}
          >
            <SelectTrigger className="text-xs text-muted-foreground" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All items</SelectItem>
              {activeCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          onValueChange={(v) => updateParam({ sort: v })}
          value={activeSort}
        >
          <SelectTrigger className="text-xs text-muted-foreground" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
