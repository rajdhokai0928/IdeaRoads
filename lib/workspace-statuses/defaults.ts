// Default feedback statuses seeded for a new workspace.
//
// `showOnRoadmap` is the explicit roadmap-visibility whitelist for Sync-ON mode:
// only Planned / In Progress / Completed appear on the roadmap by default. Open
// and Under Review (intake) and Closed (terminal) never create roadmap columns
// unless a Brand Admin explicitly enables them in Statuses settings.
//
// `showOnPublicFeed` is a separate flag controlling the public feedback
// list/board and direct post URLs. Completed is the one default status seeded
// with this off — shipped feedback stays off the public feed (it's still
// visible on the public Roadmap and in the admin panel).
export const DEFAULT_WORKSPACE_STATUSES = [
  {
    name: "Open",
    slug: "open",
    color: "#6b7280",
    isDefault: true,
    displayOrder: 0,
    showOnRoadmap: false,
    showOnPublicFeed: true,
  },
  {
    name: "Under Review",
    slug: "under_review",
    color: "#8b5cf6",
    isDefault: false,
    displayOrder: 1,
    showOnRoadmap: false,
    showOnPublicFeed: true,
  },
  {
    name: "Planned",
    slug: "planned",
    color: "#7c3aed",
    isDefault: false,
    displayOrder: 2,
    showOnRoadmap: true,
    showOnPublicFeed: true,
  },
  {
    name: "In Progress",
    slug: "in_progress",
    color: "#d97706",
    isDefault: false,
    displayOrder: 3,
    showOnRoadmap: true,
    showOnPublicFeed: true,
  },
  {
    name: "Completed",
    slug: "completed",
    color: "#059669",
    isDefault: false,
    displayOrder: 4,
    showOnRoadmap: true,
    showOnPublicFeed: false,
  },
  {
    name: "Closed",
    slug: "closed",
    color: "#374151",
    isDefault: false,
    displayOrder: 5,
    showOnRoadmap: false,
    showOnPublicFeed: true,
  },
] as const;
