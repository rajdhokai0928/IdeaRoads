"use client";

import { format } from "date-fns";
import { Bell, Edit, Globe, Lock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteChangelogEntryAction,
  publishChangelogEntryAction,
  unpublishChangelogEntryAction,
} from "@/app/actions/changelog";
import { ChangelogLabelBadge } from "@/components/changelog/changelog-label-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { truncateHtmlToText } from "@/lib/changelog/html";

interface ChangelogAdminCardProps {
  entry: {
    id: string;
    title: string;
    label: string;
    body: string;
    coverImageUrl: string | null;
    isPublished: boolean;
    publishedAt: Date | null;
    notifiedAt: Date | null;
    linkedPostCount: number;
  };
  workspaceId: string;
  workspaceSlug: string;
}

export function ChangelogAdminCard({
  entry,
  workspaceId,
  workspaceSlug,
}: ChangelogAdminCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const excerpt = truncateHtmlToText(entry.body, 180);

  function handlePublish() {
    startTransition(async () => {
      const result = await publishChangelogEntryAction({
        entryId: entry.id,
        workspaceId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry published");
      router.refresh();
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishChangelogEntryAction({
        entryId: entry.id,
        workspaceId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry moved to draft");
      router.refresh();
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const result = await deleteChangelogEntryAction({
        entryId: entry.id,
        workspaceId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry deleted");
      setDeleteDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <div
      className={`border border-border bg-card p-5 ${entry.isPublished ? "" : "opacity-80"}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <ChangelogLabelBadge label={entry.label} />
          {entry.isPublished ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-success-subtle px-2 py-0.5 text-[11px] font-semibold text-success-foreground">
              <Globe className="size-2.5" />
              Published
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-muted text-muted-foreground"
              style={{ borderRadius: 2 }}
            >
              <Lock className="size-2.5" />
              Draft
            </span>
          )}
          {entry.notifiedAt && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
              style={{ borderRadius: 2 }}
            >
              <Bell className="size-2.5" />
              Voters notified
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-primary/40 text-primary hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={`/${workspaceSlug}/settings/changelog/${entry.id}/edit`}
          >
            <Edit className="size-3" />
            Edit
          </Link>

          {entry.isPublished ? (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending}
              onClick={handleUnpublish}
            >
              <Lock className="size-3" />
              Unpublish
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending}
              onClick={handlePublish}
            >
              <Globe className="size-3" />
              Publish
            </button>
          )}

          <button
            aria-label="Delete entry"
            className="flex items-center justify-center p-1.5 text-destructive hover:opacity-70 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={isPending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${entry.title}"? This action cannot be undone.`}
        isPending={isPending}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete changelog entry"
        variant="destructive"
      />

      <div className="mt-3 flex gap-3">
        {entry.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          // biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image
          <img
            alt=""
            className="size-14 shrink-0 border border-border object-cover"
            src={entry.coverImageUrl}
          />
        )}
        <div className="min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-foreground leading-snug">
            {entry.title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {entry.publishedAt && (
          <span>{format(entry.publishedAt, "MMM d, yyyy")}</span>
        )}
        {entry.linkedPostCount > 0 && (
          <span>
            {entry.linkedPostCount} linked post
            {entry.linkedPostCount === 1 ? "" : "s"}
          </span>
        )}
        {!entry.isPublished && !entry.publishedAt && (
          <span className="italic">Not yet published</span>
        )}
      </div>
    </div>
  );
}
