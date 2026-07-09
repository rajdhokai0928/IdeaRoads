"use client";

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
  activeSort: "newest" | "top";
  activeStatus: string;
  categories: Category[];
  workspaceStatuses: WorkspaceStatus[];
}

const SORT_TABS = [
  { label: "Newest", value: "newest" },
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
      <div className="border-b border-border px-4 py-2">
        <SearchInput
          className="w-full sm:max-w-sm"
          defaultValue={activeSearch}
          onSearch={(value) => updateParam({ q: value || null })}
          placeholder="Search feedback…"
        />
      </div>
    </div>
  );
}
