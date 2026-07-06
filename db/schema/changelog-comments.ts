import { createId } from "@paralleldrive/cuid2";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { changelogEntries } from "@/db/schema/changelog";

export const changelogComments = pgTable(
  "changelog_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    changelogEntryId: text("changelog_entry_id")
      .notNull()
      .references(() => changelogEntries.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    authorName: text("author_name"),
    authorAvatar: text("author_avatar"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("changelog_comments_entry_id_idx").on(t.changelogEntryId),
    index("changelog_comments_author_id_idx").on(t.authorId),
  ]
);

export const changelogEntryReactions = pgTable(
  "changelog_entry_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    changelogEntryId: text("changelog_entry_id")
      .notNull()
      .references(() => changelogEntries.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("changelog_entry_reactions_entry_id_idx").on(t.changelogEntryId),
    index("changelog_entry_reactions_user_id_idx").on(t.userId),
  ]
);
