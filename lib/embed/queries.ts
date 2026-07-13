import { eq } from "drizzle-orm";
import { workspaceEmbedConfig } from "@/db/schema";
import type { EmbedMode, EmbedPosition, EmbedTheme } from "@/db/schema/embed";
import { db } from "@/lib/db";

export type { EmbedMode, EmbedPosition, EmbedTheme };

export const DEFAULT_EMBED_CONFIG = {
  mode: "inline" as EmbedMode,
  position: "bottom-right" as EmbedPosition,
  theme: "light" as EmbedTheme,
  width: 380,
  height: 560,
  accentColor: "#111111",
};

export async function getEmbedConfig(workspaceId: string) {
  const [row] = await db
    .select()
    .from(workspaceEmbedConfig)
    .where(eq(workspaceEmbedConfig.workspaceId, workspaceId));
  return row ?? null;
}

export async function upsertEmbedConfig(
  workspaceId: string,
  config: {
    boardId: string | null;
    mode: EmbedMode;
    position: EmbedPosition;
    theme: EmbedTheme;
    width: number;
    height: number;
    accentColor: string;
  }
) {
  const [row] = await db
    .insert(workspaceEmbedConfig)
    .values({ workspaceId, ...config })
    .onConflictDoUpdate({
      target: workspaceEmbedConfig.workspaceId,
      set: { ...config, updatedAt: new Date() },
    })
    .returning();
  return row!;
}
