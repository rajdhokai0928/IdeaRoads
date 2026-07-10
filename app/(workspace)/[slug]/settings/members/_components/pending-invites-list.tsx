"use client";

import { SpinnerIcon, XIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { revokeInviteAction } from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { workspaceRoleLabel } from "@/config/platform";

interface PendingInvite {
  createdAt: Date;
  email: string;
  expiresAt: Date;
  id: string;
  role: "owner" | "admin" | "member";
}

interface PendingInvitesListProps {
  actorRole: "owner" | "admin" | "member";
  canManage: boolean;
  invites: PendingInvite[];
  workspaceId: string;
}

function formatExpiry(date: Date): string {
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) {
    return "Expiring soon";
  }
  if (diff === 1) {
    return "Expires in 1 day";
  }
  return `Expires in ${diff} days`;
}

export function PendingInvitesList({
  invites,
  workspaceId,
  canManage,
  actorRole,
}: PendingInvitesListProps) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<PendingInvite | null>(
    null
  );

  async function handleConfirmRevoke() {
    if (!pendingRevoke) {
      return;
    }
    const invite = pendingRevoke;
    setPendingRevoke(null);
    setRevoking(invite.id);
    const result = await revokeInviteAction({
      inviteId: invite.id,
      workspaceId,
    });
    setRevoking(null);
    if (result.success) {
      toast.success("Invitation revoked");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to revoke invitation.");
    }
  }

  return (
    <>
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-eyebrow text-ir-muted uppercase">
          Pending invitations
          {invites.length > 0 ? ` (${invites.length})` : ""}
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-ir-muted">No pending invitations.</p>
        ) : (
          <div className="space-y-px overflow-hidden rounded-ir-card bg-ir-border">
            {invites.map((invite) => {
              const canRevoke =
                canManage && (actorRole === "owner" || invite.role !== "admin");
              return (
                <div
                  className="flex flex-col gap-2 bg-ir-surface px-6 py-4 transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface sm:flex-row sm:items-center sm:gap-4"
                  key={invite.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ir-heading">
                      {invite.email}
                    </p>
                    <p className="text-xs text-ir-muted">
                      {workspaceRoleLabel(invite.role)} ·{" "}
                      {formatExpiry(invite.expiresAt)}
                    </p>
                  </div>
                  {canRevoke && (
                    <Button
                      className="shrink-0 text-ir-danger hover:opacity-70"
                      disabled={revoking === invite.id}
                      onClick={() => setPendingRevoke(invite)}
                      size="sm"
                      variant="ghost"
                    >
                      {revoking === invite.id ? (
                        <SpinnerIcon className="size-4 animate-spin" />
                      ) : (
                        <XIcon className="size-4" />
                      )}
                      <span className="ml-1.5">Revoke</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Revoke"
        description={`Revoke the invitation sent to ${pendingRevoke?.email ?? "this person"}? They will no longer be able to use this invite link.`}
        isPending={!!revoking}
        onConfirm={handleConfirmRevoke}
        onOpenChange={(open) => !open && setPendingRevoke(null)}
        open={!!pendingRevoke}
        title="Revoke Invitation"
      />
    </>
  );
}
