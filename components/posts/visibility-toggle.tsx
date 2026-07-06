"use client";

import { Eye, EyeOff } from "lucide-react";
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
      <Eye aria-label="Visible" className="size-4 text-success">
        <title>Visible</title>
      </Eye>
    ) : (
      <EyeOff aria-label="Pending review" className="size-4 text-warning">
        <title>Pending review</title>
      </EyeOff>
    );
  }

  return (
    <button
      aria-label={
        isApproved ? "Hide from public (pending review)" : "Make visible"
      }
      className={`transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isApproved
          ? "text-success hover:text-warning"
          : "text-warning hover:text-success"
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
      {isApproved ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </button>
  );
}
