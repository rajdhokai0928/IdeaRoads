"use client";

import { DotsThreeIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  changeRoleAction,
  removeMemberAction,
  transferOwnershipAction,
} from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SquareAvatar } from "@/components/ui/square-avatar";
import {
  WORKSPACE_ADMIN,
  WORKSPACE_MEMBER,
  WORKSPACE_OWNER,
  workspaceRoleLabel,
} from "@/config/platform";

interface Member {
  id: string;
  joinedAt: Date;
  role: "owner" | "admin" | "member";
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  userId: string;
}

interface MembersTableProps {
  actorMemberId: string;
  actorRole: "owner" | "admin" | "member";
  actorUserId: string;
  members: Member[];
  workspaceId: string;
}

interface PendingConfirm {
  action: () => Promise<{
    success: boolean;
    error?: string;
    redirectTo?: string;
  }>;
  confirmLabel: string;
  description: string;
  memberId: string;
  successMessage: string;
  title: string;
}

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-ir-primary text-ir-primary-foreground",
  admin: "bg-ir-primary-light/15 text-ir-primary",
  member: "bg-ir-muted-surface text-ir-muted",
};

export function MembersTable({
  members,
  actorMemberId,
  actorUserId,
  actorRole,
  workspaceId,
}: MembersTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null
  );

  async function handleAction(
    memberId: string,
    action: () => Promise<{
      success: boolean;
      error?: string;
      redirectTo?: string;
    }>
  ) {
    setLoadingId(memberId);
    setErrors((prev) => ({ ...prev, [memberId]: "" }));
    const result = await action();
    setLoadingId(null);
    if (!result.success && result.error) {
      setErrors((prev) => ({ ...prev, [memberId]: result.error! }));
    } else if (result.redirectTo) {
      router.replace(result.redirectTo);
    } else {
      router.refresh();
    }
  }

  async function handleConfirmedAction() {
    if (!pendingConfirm) {
      return;
    }
    const { memberId, action, successMessage } = pendingConfirm;
    setPendingConfirm(null);
    setLoadingId(memberId);
    const result = await action();
    setLoadingId(null);
    if (!result.success && result.error) {
      toast.error(result.error);
    } else {
      toast.success(successMessage);
      if (result.redirectTo) {
        router.replace(result.redirectTo);
      } else {
        router.refresh();
      }
    }
  }

  return (
    <>
      <div className="space-y-px overflow-hidden rounded-ir-card bg-ir-border">
        {members.map((member) => {
          const isSelf = member.userId === actorUserId;
          const isOwner = member.role === WORKSPACE_OWNER;
          const canChangeRole =
            (actorRole === WORKSPACE_OWNER && !isOwner) ||
            (actorRole === WORKSPACE_ADMIN &&
              member.role === WORKSPACE_MEMBER &&
              !isSelf);
          const canRemove =
            !isOwner &&
            !isSelf &&
            (actorRole === WORKSPACE_OWNER ||
              (actorRole === WORKSPACE_ADMIN &&
                member.role === WORKSPACE_MEMBER));
          const canTransfer =
            actorRole === WORKSPACE_OWNER && !isOwner && !isSelf;
          const showMenu = canChangeRole || canRemove || canTransfer;

          return (
            <div
              className="flex flex-col gap-2 bg-ir-surface px-6 py-4 transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface sm:flex-row sm:items-center sm:gap-4"
              key={member.id}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <SquareAvatar
                  alt={member.user.name ?? member.user.email}
                  className="size-9 bg-ir-muted-surface text-sm font-semibold text-ir-muted uppercase"
                  fallback={(member.user.name || member.user.email).charAt(0)}
                  imageUrl={member.user.image}
                />
                <div className="min-w-0 flex-1">
                  {member.user.name && (
                    <p className="truncate text-sm font-medium text-ir-heading">
                      {member.user.name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-ir-muted">
                          (you)
                        </span>
                      )}
                    </p>
                  )}
                  <p
                    className={`truncate text-sm ${member.user.name ? "text-ir-muted" : "font-medium text-ir-heading"}`}
                  >
                    {member.user.email}
                    {!member.user.name && isSelf && (
                      <span className="ml-1.5 text-xs font-normal text-ir-muted">
                        (you)
                      </span>
                    )}
                  </p>
                  {errors[member.id] && (
                    <p className="mt-0.5 text-xs text-ir-danger">
                      {errors[member.id]}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`shrink-0 rounded-ir-sm px-2 py-0.5 text-xs font-semibold tracking-wider uppercase ${ROLE_BADGE[member.role]}`}
                >
                  {workspaceRoleLabel(member.role)}
                </span>
                {showMenu && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`Actions for ${member.user.name ?? member.user.email}`}
                        className="text-ir-muted hover:text-ir-heading"
                        disabled={loadingId === member.id}
                        size="icon-xs"
                        variant="ghost"
                      >
                        {loadingId === member.id ? (
                          <SpinnerIcon className="size-4 animate-spin" />
                        ) : (
                          <DotsThreeIcon className="size-4" weight="bold" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canChangeRole && (
                        <>
                          {member.role === WORKSPACE_MEMBER && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleAction(member.id, () =>
                                  changeRoleAction({
                                    memberId: member.id,
                                    workspaceId,
                                    role: "admin",
                                  })
                                )
                              }
                            >
                              Promote to Brand Admin
                            </DropdownMenuItem>
                          )}
                          {member.role === WORKSPACE_ADMIN && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleAction(member.id, () =>
                                  changeRoleAction({
                                    memberId: member.id,
                                    workspaceId,
                                    role: "member",
                                  })
                                )
                              }
                            >
                              Change to Team Member
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {canTransfer && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() =>
                            setPendingConfirm({
                              title: "Transfer Ownership",
                              description: `Transfer workspace ownership to ${member.user.name ?? member.user.email}? You will remain a Brand Admin but lose ownership of this workspace.`,
                              memberId: member.id,
                              confirmLabel: "Transfer",
                              action: () =>
                                transferOwnershipAction({
                                  targetMemberId: member.id,
                                  workspaceId,
                                }),
                              successMessage:
                                "Ownership transferred successfully",
                            })
                          }
                        >
                          Transfer ownership
                        </DropdownMenuItem>
                      )}
                      {(canChangeRole || canTransfer) && canRemove && (
                        <DropdownMenuSeparator />
                      )}
                      {canRemove && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() =>
                            setPendingConfirm({
                              title: "Remove Member",
                              description: `Remove ${member.user.name ?? member.user.email} from this workspace? They will lose all access immediately.`,
                              memberId: member.id,
                              confirmLabel: "Remove",
                              action: () =>
                                removeMemberAction({
                                  memberId: member.id,
                                  workspaceId,
                                }),
                              successMessage: "Member removed successfully",
                            })
                          }
                          variant="destructive"
                        >
                          Remove member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        confirmLabel={pendingConfirm?.confirmLabel ?? "Confirm"}
        description={pendingConfirm?.description ?? ""}
        isPending={!!loadingId}
        onConfirm={handleConfirmedAction}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
        open={!!pendingConfirm}
        title={pendingConfirm?.title ?? ""}
      />
    </>
  );
}
