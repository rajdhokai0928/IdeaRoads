"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCT_NAME } from "@/config/platform";
import {
  account,
  comments,
  posts,
  session as sessionTable,
  user,
  votes,
  workspaces,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { confirmEmailChangeTemplate } from "@/lib/email/templates/confirm-email-change";
import {
  createPendingEmailChange,
  deletePendingEmailChange,
  getPendingEmailChangeByToken,
} from "@/lib/profile/email-change";
import { deleteFile, uploadFile } from "@/lib/storage";
import { countCharacters } from "@/lib/text-metrics";
import { adminBaseUrl } from "@/lib/urls";

export interface ActionState {
  error?: string;
  success?: string;
}

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export interface AvatarActionState extends ActionState {
  imageUrl?: string | null;
}

export interface NameActionState extends ActionState {
  name?: string;
}

export async function updateAvatarAction(
  _state: AvatarActionState,
  formData: FormData
): Promise<AvatarActionState> {
  const session = await requireSession();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { error: "Use a PNG, JPEG, WEBP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be 4MB or smaller." };
  }

  const [freshUser] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const extension = file.type.split("/")[1];
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(
    `avatars/${session.user.id}-${Date.now()}.${extension}`,
    buffer,
    file.type
  );

  await db
    .update(user)
    .set({ image: url, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  if (freshUser?.image) {
    await deleteFile(freshUser.image).catch(() => {});
  }

  await audit({
    action: "profile.avatar_updated",
    actorEmail: session.user.email,
    actorId: session.user.id,
    description: "Updated profile picture",
    entityId: session.user.id,
    entityType: "user",
  });

  revalidatePath("/", "layout");
  return { imageUrl: url, success: "Profile picture updated." };
}

export async function removeAvatarAction(): Promise<AvatarActionState> {
  const session = await requireSession();

  const [freshUser] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!freshUser?.image) {
    return { imageUrl: null, success: "Profile picture removed." };
  }

  await db
    .update(user)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  await deleteFile(freshUser.image).catch(() => {});

  await audit({
    action: "profile.avatar_removed",
    actorEmail: session.user.email,
    actorId: session.user.id,
    description: "Removed profile picture",
    entityId: session.user.id,
    entityType: "user",
  });

  revalidatePath("/", "layout");
  return { imageUrl: null, success: "Profile picture removed." };
}

export async function updateNameAction(
  _state: NameActionState,
  formData: FormData
): Promise<NameActionState> {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }
  if (countCharacters(name) > 100) {
    return { error: "Name must be 100 characters or fewer." };
  }

  await db
    .update(user)
    .set({ name, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  await audit({
    action: "profile.name_updated",
    actorEmail: session.user.email,
    actorId: session.user.id,
    description: "Updated profile name",
    entityId: session.user.id,
    entityType: "user",
    metadata: { name },
  });

  revalidatePath("/", "layout");
  return { success: "Name updated.", name };
}

export async function changeEmailAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const current = await requireSession();
  const newEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { error: "Enter a valid email address." };
  }

  if (newEmail === current.user.email.toLowerCase()) {
    return { error: "That is already your current email address." };
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, newEmail))
    .limit(1);

  if (existing && existing.id !== current.user.id) {
    return { error: "That email is already in use." };
  }

  // The email only changes once this link is clicked — that's what actually
  // proves ownership of the new address. Without this, workspace invites
  // (which match on email) could be hijacked by anyone who self-reports
  // someone else's email address, since that never required verification.
  const { token } = await createPendingEmailChange(current.user.id, newEmail);
  const confirmUrl = `${adminBaseUrl()}/account/confirm-email/${token}`;

  const { html, text } = await confirmEmailChangeTemplate({
    newEmail,
    confirmUrl,
  });
  await enqueueEmail({
    to: newEmail,
    subject: `Confirm your new email address — ${PRODUCT_NAME}`,
    html,
    text,
  });

  await audit({
    action: "profile.email_change_requested",
    actorEmail: current.user.email,
    actorId: current.user.id,
    description: `Requested email change to ${newEmail} (pending confirmation)`,
    entityId: current.user.id,
    entityType: "user",
    metadata: { newEmail },
  });

  return {
    success: `We sent a confirmation link to ${newEmail}. Click it to finish changing your email — your current email stays active until then.`,
  };
}

export async function confirmEmailChangeAction(
  token: string
): Promise<ActionResult<{ newEmail: string }>> {
  const current = await requireSession();

  const pending = await getPendingEmailChangeByToken(token);
  if (!pending) {
    return { success: false, error: "This confirmation link is invalid." };
  }
  if (pending.userId !== current.user.id) {
    return {
      success: false,
      error: "This confirmation link belongs to a different account.",
    };
  }
  if (pending.expiresAt <= new Date()) {
    return {
      success: false,
      error: "This confirmation link has expired. Request a new email change.",
    };
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, pending.newEmail))
    .limit(1);
  if (existing && existing.id !== current.user.id) {
    await deletePendingEmailChange(current.user.id);
    return { success: false, error: "That email is already in use." };
  }

  await db
    .update(user)
    .set({
      email: pending.newEmail,
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(user.id, current.user.id));

  await deletePendingEmailChange(current.user.id);

  await audit({
    action: "profile.email_updated",
    actorEmail: pending.newEmail,
    actorId: current.user.id,
    description: `Confirmed email change to ${pending.newEmail}`,
    entityId: current.user.id,
    entityType: "user",
    metadata: { newEmail: pending.newEmail, oldEmail: current.user.email },
  });

  revalidatePath("/", "layout");
  return { success: true, data: { newEmail: pending.newEmail } };
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const current = await requireSession();
  const sessionId = String(formData.get("sessionId") ?? "");

  const [row] = await db
    .select({
      id: sessionTable.id,
      token: sessionTable.token,
      userId: sessionTable.userId,
    })
    .from(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .limit(1);

  if (!row || row.userId !== current.user.id) {
    return;
  }
  if (row.token === current.session.token) {
    return;
  }

  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
  await audit({
    action: "profile.session_revoked",
    actorEmail: current.user.email,
    actorId: current.user.id,
    description: "Revoked an active session",
    entityId: sessionId,
    entityType: "session",
  });

  revalidatePath("/", "layout");
}

export async function signOutOtherSessionsAction(): Promise<void> {
  const current = await requireSession();
  const rows = await db
    .select({ id: sessionTable.id })
    .from(sessionTable)
    .where(
      and(
        eq(sessionTable.userId, current.user.id),
        ne(sessionTable.token, current.session.token)
      )
    );

  const ids = rows.map((row) => row.id);
  if (ids.length > 0) {
    await db.delete(sessionTable).where(inArray(sessionTable.id, ids));
  }

  await audit({
    action: "profile.other_sessions_revoked",
    actorEmail: current.user.email,
    actorId: current.user.id,
    description: `Signed out ${ids.length} other session(s)`,
    entityId: current.user.id,
    entityType: "user",
    metadata: { revokedCount: ids.length },
  });

  revalidatePath("/", "layout");
}

export async function deleteAccountAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const current = await requireSession();
  const confirmEmail = String(formData.get("confirmEmail") ?? "")
    .trim()
    .toLowerCase();

  const [freshUser] = await db
    .select({ email: user.email, id: user.id })
    .from(user)
    .where(eq(user.id, current.user.id))
    .limit(1);

  if (!freshUser) {
    return { error: "Account not found." };
  }

  if (confirmEmail !== freshUser.email.toLowerCase()) {
    return { error: "Type your email address to confirm deletion." };
  }

  // Deleting the account would set owned workspaces' owner_id to NULL and remove
  // the owner's membership, leaving those workspaces orphaned. Require ownership
  // to be transferred (or the workspace deleted) first.
  const ownedWorkspaces = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerId, freshUser.id));

  if (ownedWorkspaces.length > 0) {
    return {
      error:
        "You still own one or more workspaces. Transfer ownership (or delete those workspaces) before deleting your account.",
    };
  }

  await audit({
    action: "profile.account_deleted",
    actorEmail: freshUser.email,
    actorId: freshUser.id,
    description: "Deleted account",
    entityId: freshUser.id,
    entityType: "user",
  });

  await db.transaction(async (tx) => {
    // Anonymise the user's feedback before removing the account (Feature 01):
    // content and vote counts are preserved, but the denormalised authorship PII
    // is scrubbed. The author/voter id columns are FK `set null` on user delete;
    // these updates clear the denormalised name/email text. Must run before the
    // user row is deleted (the WHERE matches on the still-present author/user id).
    await tx
      .update(posts)
      .set({
        authorName: "Anonymous",
        authorEmail: "anonymous@deleted.invalid",
      })
      .where(eq(posts.authorId, freshUser.id));
    await tx
      .update(comments)
      .set({ authorName: null, authorEmail: null, authorAvatar: null })
      .where(eq(comments.authorId, freshUser.id));
    await tx
      .update(votes)
      .set({ userName: null, userEmail: null })
      .where(eq(votes.userId, freshUser.id));

    await tx.delete(sessionTable).where(eq(sessionTable.userId, freshUser.id));
    await tx.delete(account).where(eq(account.userId, freshUser.id));
    await tx.delete(user).where(eq(user.id, freshUser.id));
  });

  redirect("/signin");
}
