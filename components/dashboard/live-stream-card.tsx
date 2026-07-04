import { formatDistanceToNow } from "date-fns";
import { ChevronUp, Lightbulb, MessageSquare, Radio } from "lucide-react";
import Link from "next/link";
import { ParamSelect } from "@/components/dashboard/param-select";
import type { ActivityItem, ActivityType } from "@/lib/dashboard/queries";

interface LiveStreamCardProps {
  activity: ActivityItem[];
  activityType: ActivityType;
  workspaceSlug: string;
}

const TYPE_OPTIONS = [
  { label: "All Activity", value: "all" },
  { label: "Feedback", value: "post" },
  { label: "Comments", value: "comment" },
  { label: "Votes", value: "vote" },
];

const TYPE_ICON = {
  post: Lightbulb,
  comment: MessageSquare,
  vote: ChevronUp,
} as const;

function describe(item: ActivityItem): string {
  const author = item.authorName ?? "Someone";
  switch (item.type) {
    case "post":
      return `${author} submitted new feedback`;
    case "comment":
      return `${author} commented`;
    case "vote":
      return `${author} voted`;
  }
}

export function LiveStreamCard({
  activity,
  activityType,
  workspaceSlug,
}: LiveStreamCardProps) {
  return (
    <div className="flex flex-col border border-border bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Live Stream</h2>
        <ParamSelect
          options={TYPE_OPTIONS}
          paramName="activityType"
          value={activityType}
        />
      </div>

      {activity.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <Radio className="size-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {activity.map((item) => {
            const Icon = TYPE_ICON[item.type];
            return (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  className="flex items-start gap-3 px-5 py-3 transition-colors duration-150 hover:bg-muted/40"
                  href={`/${workspaceSlug}/feedback/${item.postId}`}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {describe(item)}{" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-medium">{item.postTitle}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.boardName} ·{" "}
                      {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
