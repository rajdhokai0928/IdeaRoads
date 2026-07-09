// Default categories seeded into every new workspace (mirrors
// DEFAULT_WORKSPACE_STATUSES). A workspace ships with these so the category
// picker is never empty; they remain fully editable/deletable by a Brand Admin.
// Categories stay optional on a post (posts.categoryId is nullable) — nothing
// here auto-assigns a category.
export const DEFAULT_CATEGORIES = [
  {
    name: "Feature Request",
    slug: "feature-request",
    color: "#6366f1",
    displayOrder: 0,
  },
  {
    name: "Bug",
    slug: "bug",
    color: "#ef4444",
    displayOrder: 1,
  },
  {
    name: "Improvement",
    slug: "improvement",
    color: "#22c55e",
    displayOrder: 2,
  },
] as const;
