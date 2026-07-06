import { MessageSquare } from "lucide-react";
import { listChangelogComments } from "@/lib/changelog-comments/queries";
import { ChangelogCommentList } from "./changelog-comment-list";
import type { ChangelogCommentData } from "./changelog-comment-types";

interface ChangelogCommentSectionProps {
  changelogEntryId: string;
  currentUserId: string | null;
  isMember: boolean;
  isSignedIn: boolean;
}

export async function ChangelogCommentSection({
  changelogEntryId,
  isSignedIn,
  currentUserId,
  isMember,
}: ChangelogCommentSectionProps) {
  const raw = await listChangelogComments(changelogEntryId);

  const comments: ChangelogCommentData[] = raw
    .filter((c) => !c.isDeleted)
    .map((c) => ({
      id: c.id,
      changelogEntryId: c.changelogEntryId,
      body: c.body,
      isDeleted: c.isDeleted,
      authorId: c.authorId,
      authorName: c.authorName,
      authorAvatar: c.authorAvatar,
      isGuest: !c.authorId,
      createdAt: c.createdAt.toISOString(),
    }));

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-6">
        <MessageSquare className="size-4 text-muted-foreground" />
        {comments.length === 0
          ? "Comments"
          : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
      </h2>

      <ChangelogCommentList
        changelogEntryId={changelogEntryId}
        currentUserId={currentUserId}
        initialComments={comments}
        isMember={isMember}
        isSignedIn={isSignedIn}
      />
    </div>
  );
}
