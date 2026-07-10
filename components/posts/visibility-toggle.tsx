"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { approvePostAction, unapprovePostAction } from "@/app/actions/posts";

interface VisibilityToggleProps {
  canEdit: boolean;
  isApproved: boolean;
  postId: string;
  workspaceId: string;
}

// Admin/owner-only control for whether a post is publicly visible or held
// back from the public — the same isApproved flag the moderation queue uses,
// exposed here as a single click-to-toggle eye icon instead of a dropdown.
export default function VisibilityToggle({
  postId,
  workspaceId,
  isApproved,
  canEdit,
}: VisibilityToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (isPending) {
      return;
    }
    startTransition(async () => {
      const result = isApproved
        ? await unapprovePostAction({ postId, workspaceId })
        : await approvePostAction({ postId, workspaceId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!canEdit) {
    return isApproved ? (
      <EyeIcon aria-label="Visible" className="size-4 text-ir-success">
        <title>Visible</title>
      </EyeIcon>
    ) : (
      <EyeSlashIcon
        aria-label="Pending review"
        className="size-4 text-ir-warning"
      >
        <title>Pending review</title>
      </EyeSlashIcon>
    );
  }

  return (
    <button
      aria-label={
        isApproved ? "Hide from public (pending review)" : "Make visible"
      }
      className={`rounded-ir-sm p-1 transition-all duration-150 ease-ir-standard hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 ${
        isApproved
          ? "text-ir-success hover:text-ir-warning"
          : "text-ir-warning hover:text-ir-success"
      }`}
      disabled={isPending}
      onClick={handleToggle}
      title={
        isApproved
          ? "Visible — click to hide (pending review)"
          : "Pending review — click to make visible"
      }
      type="button"
    >
      {isApproved ? (
        <EyeIcon className="size-4" />
      ) : (
        <EyeSlashIcon className="size-4" />
      )}
    </button>
  );
}
