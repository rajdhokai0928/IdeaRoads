import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { boards } from "@/db/schema/boards";
import { workspaces } from "@/db/schema/workspaces";

export type EmbedMode = "inline" | "button";
export type EmbedPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";
export type EmbedTheme = "light" | "dark" | "auto";

export const workspaceEmbedConfig = pgTable("workspace_embed_config", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  // Which board the snippet embeds. Nullable: a workspace might not have a
  // public board yet, and the board can be deleted after being configured
  // here — the embed settings UI falls back to the first public board when
  // this is unset. Without a board, the generated snippet has nothing valid
  // to point at (there's no "all boards" public route to fall back to).
  boardId: text("board_id").references(() => boards.id, {
    onDelete: "set null",
  }),
  mode: text("mode").$type<EmbedMode>().notNull().default("inline"),
  position: text("position")
    .$type<EmbedPosition>()
    .notNull()
    .default("bottom-right"),
  theme: text("theme").$type<EmbedTheme>().notNull().default("light"),
  width: integer("width").notNull().default(380),
  height: integer("height").notNull().default(560),
  accentColor: text("accent_color").notNull().default("#111111"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
