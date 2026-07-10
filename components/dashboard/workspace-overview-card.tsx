import { UsersIcon as Users } from "@phosphor-icons/react/dist/ssr";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SquareAvatar } from "@/components/ui/square-avatar";

interface WorkspaceOverviewCardProps {
  boardIsPublic: boolean | null;
  createdAt: Date;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
  name: string;
}

export function WorkspaceOverviewCard({
  boardIsPublic,
  createdAt,
  description,
  logoUrl,
  memberCount,
  name,
}: WorkspaceOverviewCardProps) {
  const boardLabel =
    boardIsPublic === null
      ? "No board yet"
      : boardIsPublic
        ? "Public board"
        : "Private board";

  return (
    <div className="flex flex-col gap-4 rounded-ir-card border border-ir-border bg-ir-surface px-5 py-4 shadow-ir-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <SquareAvatar
          alt={name}
          className="size-10 rounded-ir-sm bg-ir-primary-light/20 text-sm font-semibold text-ir-primary"
          fallback={name.charAt(0).toUpperCase()}
          imageUrl={logoUrl}
        />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ir-heading">
            {name}
          </h2>
          {description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-ir-muted">
              {description}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-ir-muted">
              Created {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge className="gap-1.5" variant="secondary">
          <Users className="size-3" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </Badge>
        <Badge variant={boardIsPublic ? "default" : "secondary"}>
          {boardLabel}
        </Badge>
      </div>
    </div>
  );
}
