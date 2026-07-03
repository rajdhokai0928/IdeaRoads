import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
