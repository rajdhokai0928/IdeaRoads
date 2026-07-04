"use client";

import { useRouter } from "next/navigation";

interface Board {
  id: string;
  name: string;
  slug: string;
}

interface BoardSwitcherProps {
  activeBoardSlug?: string;
  boards: Board[];
  workspaceSlug: string;
}

// Only rendered for anonymous visitors (signed-in members get the full
// workspace sidebar instead), so every board here is guaranteed public.
export function BoardSwitcher({
  boards,
  activeBoardSlug,
  workspaceSlug,
}: BoardSwitcherProps) {
  const router = useRouter();

  if (boards.length === 0) {
    return null;
  }

  return (
    <select
      className="h-8 cursor-pointer border border-border bg-muted px-2.5 pr-7 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(e) => router.push(`/${workspaceSlug}/b/${e.target.value}`)}
      value={activeBoardSlug ?? boards[0]!.slug}
    >
      {boards.map((board) => (
        <option key={board.id} value={board.slug}>
          {board.name}
        </option>
      ))}
    </select>
  );
}
