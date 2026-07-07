"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updatePostStatusAction } from "@/app/actions/posts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkspaceStatus {
  color: string;
  id: string;
  isArchived: boolean;
  name: string;
  slug: string;
}

interface StatusSelectProps {
  canEdit: boolean;
  currentStatus: string;
  postId: string;
  workspaceId: string;
  workspaceStatuses: WorkspaceStatus[];
}

export default function StatusSelect({
  postId,
  workspaceId,
  currentStatus,
  canEdit,
  workspaceStatuses,
}: StatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeStatuses = workspaceStatuses.filter((s) => !s.isArchived);
  const current = workspaceStatuses.find((s) => s.slug === currentStatus);

  function handleChange(status: string) {
    if (status === currentStatus) {
      return;
    }

    startTransition(async () => {
      await updatePostStatusAction({ postId, workspaceId, status });
      router.refresh();
    });
  }

  const displayName = current?.name ?? currentStatus.replace(/_/g, " ");
  const displayColor = current?.color ?? "#6b7280";

  if (!canEdit) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
        style={{
          backgroundColor: `${displayColor}18`,
          color: displayColor,
          borderRadius: 2,
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: displayColor }}
        />
        {displayName}
      </span>
    );
  }

  return (
    <Select
      disabled={isPending}
      onValueChange={handleChange}
      value={currentStatus}
    >
      <SelectTrigger
        className="h-auto gap-1.5 rounded-xs border-0 bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {activeStatuses.map((s) => (
          <SelectItem key={s.slug} value={s.slug}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
