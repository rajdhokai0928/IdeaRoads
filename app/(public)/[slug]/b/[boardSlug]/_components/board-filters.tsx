"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { SearchInput } from "@/components/ui/search-input";
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

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Any filter/sort/search change resets pagination back to the first page,
      // so you never land on an out-of-range page of the new result set.
      params.delete("page");
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

  function toggleMyVotes() {
    updateParam({ myVotes: myVotesActive ? null : "true" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-4">
      {/* Search */}
      <SearchInput
        className="h-9 min-w-50 flex-1"
        defaultValue={activeSearch}
        onSearch={(value) => updateParam({ q: value || null })}
        placeholder="Search"
      />

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
