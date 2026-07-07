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

interface WorkspaceStatus {
  color: string;
  name: string;
  slug: string;
}

interface BoardFiltersProps {
  activeSearch: string;
  activeSort: "newest" | "top" | "trending";
  activeStatus: string;
  myVotesActive: boolean;
  showMyVotes: boolean;
  workspaceStatuses: WorkspaceStatus[];
}

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Trending", value: "trending" },
  { label: "Most Voted", value: "top" },
] as const;

export default function BoardFilters({
  activeSort,
  activeStatus,
  activeSearch,
  myVotesActive,
  showMyVotes,
  workspaceStatuses,
}: BoardFiltersProps) {
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

  function toggleMyVotes() {
    updateParam({ myVotes: myVotesActive ? null : "true" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-4">
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

      {/* Right controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {showMyVotes && (
          <button
            className={`flex h-9 items-center gap-1.5 border px-3 text-sm font-medium transition-colors cursor-pointer duration-150 focus-visible:outline-none ${
              myVotesActive
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            }`}
            onClick={toggleMyVotes}
            type="button"
          >
            My Votes
            {myVotesActive && <X className="size-3" />}
          </button>
        )}

        <Select
          onValueChange={(v) => updateParam({ status: v === "all" ? null : v })}
          value={activeStatus || "all"}
        >
          <SelectTrigger className="text-xs text-muted-foreground" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status</SelectItem>
            {workspaceStatuses.map((s) => (
              <SelectItem key={s.slug} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
