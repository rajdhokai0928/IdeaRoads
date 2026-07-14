"use server";

import { z } from "zod";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { audit } from "@/lib/audit";
import { requireSession } from "@/lib/authz";
import { getBoardById } from "@/lib/boards/queries";
import { upsertEmbedConfig } from "@/lib/embed/queries";
import { getWorkspaceMember } from "@/lib/workspaces/queries";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string };

const updateSchema = z.object({
  workspaceId: z.string().min(1),
  // Required: the embed is meaningless without a board to show, and a config
  // saved without one produces a snippet with no data-board — the exact gap
  // that sends embedded visitors into a broken, cross-host auth redirect.
  boardId: z.string().min(1),
  mode: z.enum(["inline", "button"]),
  position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  theme: z.enum(["light", "dark", "auto"]),
  width: z.number().int().min(240).max(1200),
  height: z.number().int().min(240).max(1200),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #2563eb."),
});

export async function updateEmbedConfigAction(input: {
  workspaceId: string;
  boardId: string;
  mode: string;
  position: string;
  theme: string;
  width: number;
  height: number;
  accentColor: string;
}): Promise<ActionResult<undefined>> {
  const session = await requireSession();

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Invalid input.",
      field: first?.path[0] as string | undefined,
    };
  }

  const member = await getWorkspaceMember(
    parsed.data.workspaceId,
    session.user.id
  );
  if (!member || member.role === WORKSPACE_MEMBER) {
    return {
      success: false,
      error: "Only admins and owners can configure the embed widget.",
    };
  }

  // The embed is anonymous/public — the board must actually be public, and
  // must belong to this workspace (cross-tenant safety).
  const board = await getBoardById(parsed.data.boardId);
  if (
    !board ||
    board.workspaceId !== parsed.data.workspaceId ||
    !board.isPublic
  ) {
    return { success: false, error: "Choose a public board to embed." };
  }

  const { workspaceId, ...config } = parsed.data;
  await upsertEmbedConfig(workspaceId, config);

  audit({
    workspaceId,
    action: "embed_config.updated",
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name ?? null,
    entityType: "embed_config",
    entityId: workspaceId,
    entityName: "Embed widget",
    description: "Embed widget configuration updated",
    metadata: config,
  });

  return { success: true, data: undefined };
}
