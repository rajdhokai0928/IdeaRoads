import { ChevronUp, MessageSquare } from "lucide-react";

/* ─── Board mockup ─────────────────────────────────────────────────── */

const BOARD_POSTS = [
  {
    votes: 42,
    title: "Add dark mode support",
    status: "Planned",
    category: "Design",
    comments: 8,
  },
  {
    votes: 31,
    title: "Custom webhook integrations",
    status: "In Progress",
    category: "Developer",
    comments: 11,
  },
  {
    votes: 24,
    title: "Export feedback to CSV",
    status: "Planned",
    category: "Data",
    comments: 6,
  },
] as const;

function BoardMockup() {
  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-2.5">
        <div className="flex shrink-0 gap-1.5">
          <span className="block size-2 bg-border" />
          <span className="block size-2 bg-border" />
          <span className="block size-2 bg-border" />
        </div>
        <div className="min-w-0 flex-1 border border-border bg-card px-3 py-0.5 text-center">
          <span className="font-mono text-2xs text-muted-foreground">
            acme.idearoads.com/boards/feature-requests
          </span>
        </div>
      </div>
      {/* Board header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          Feature Requests
        </span>
        <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
          48 posts
        </span>
      </div>
      {/* Posts */}
      <div className="divide-y divide-border">
        {BOARD_POSTS.map((post) => (
          <div className="flex items-stretch" key={post.title}>
            <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border px-2 py-3">
              <ChevronUp
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
              />
              <span className="font-mono text-sm font-semibold text-foreground">
                {post.votes}
              </span>
            </div>
            <div className="min-w-0 flex-1 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-medium text-foreground">
                  {post.title}
                </span>
                <span className="shrink-0 text-2xs font-semibold uppercase tracking-ui text-success">
                  {post.status}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                <span className="text-2xs font-semibold uppercase tracking-ui">
                  {post.category}
                </span>
                <span className="text-2xs">·</span>
                <div className="flex items-center gap-1">
                  <MessageSquare aria-hidden="true" className="size-3" />
                  <span className="text-2xs">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Roadmap mockup ───────────────────────────────────────────────── */

const ROADMAP_COLUMNS = [
  {
    label: "Planned",
    count: 3,
    cards: [
      "Add dark mode support",
      "Export feedback to CSV",
      "Custom email templates",
    ],
  },
  {
    label: "In Progress",
    count: 2,
    cards: ["Custom webhook integrations", "Zapier integration"],
  },
  {
    label: "Completed",
    count: 6,
    cards: ["Board sorting options", "Guest voting via email"],
  },
] as const;

function RoadmapMockup() {
  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          Public Roadmap
        </span>
      </div>
      {/* Columns */}
      <div className="grid grid-cols-3 divide-x divide-border">
        {ROADMAP_COLUMNS.map(({ label, count, cards }) => (
          <div key={label}>
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-2xs font-semibold uppercase tracking-ui text-foreground">
                {label}
              </span>
              <span className="font-mono text-2xs text-muted-foreground">
                {count}
              </span>
            </div>
            <div className="space-y-2 p-2">
              {cards.map((title) => (
                <div
                  className="border border-border bg-background p-2.5"
                  key={title}
                >
                  <p className="text-xs font-medium leading-4 text-foreground">
                    {title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Changelog mockup ─────────────────────────────────────────────── */

function ChangelogMockup() {
  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Changelog</span>
        <span className="text-2xs font-semibold uppercase tracking-ui text-success">
          Latest
        </span>
      </div>
      {/* Entry */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
            Jun 24, 2026
          </span>
        </div>
        <h4 className="mt-2 font-bold text-base text-foreground">
          Dark mode is here
        </h4>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          After 42 votes and months of work, dark mode is now available for all
          workspaces. Toggle it in your profile settings.
        </p>
        {/* Linked posts */}
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
            Delivered
          </p>
          <div className="mt-2 flex items-center gap-2 border border-border bg-muted px-3 py-2">
            <ChevronUp
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
            <span className="font-mono text-2xs font-semibold text-muted-foreground">
              42
            </span>
            <span className="text-xs font-medium text-foreground">
              Add dark mode support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Email mockup ─────────────────────────────────────────────────── */

function EmailMockup() {
  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Email headers */}
      <div className="space-y-1.5 border-b border-border bg-muted px-4 py-3">
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-2xs font-semibold text-muted-foreground">
            From
          </span>
          <span className="text-2xs text-foreground">
            IdeaRoads · Acme Corp &lt;noreply@acme.com&gt;
          </span>
        </div>
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-2xs font-semibold text-muted-foreground">
            To
          </span>
          <span className="text-2xs text-foreground">alex@example.com</span>
        </div>
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-2xs font-semibold text-muted-foreground">
            Subject
          </span>
          <span className="text-2xs font-semibold text-foreground">
            Dark mode just shipped — you asked for this
          </span>
        </div>
      </div>
      {/* Email body */}
      <div className="space-y-3 p-5 text-sm">
        <p className="text-foreground">Hi Alex,</p>
        <p className="leading-5 text-muted-foreground">
          Something you voted for just shipped. The team at Acme Corp has
          published a new update.
        </p>
        {/* Changelog card */}
        <div className="border border-border bg-muted p-3">
          <p className="text-xs font-semibold text-foreground">
            Dark mode is here
          </p>
          <p className="mt-0.5 text-2xs text-muted-foreground">Jun 24, 2026</p>
          <p className="mt-1.5 text-xs leading-4 text-muted-foreground">
            Toggle it in your profile settings. Available on all workspaces now.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          You're receiving this because you voted for this feature.{" "}
          <span className="underline">Unsubscribe</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Tour frame ───────────────────────────────────────────────────── */

const FRAMES = [
  {
    step: "01",
    heading: "Feedback lands where it belongs.",
    caption:
      "Users submit requests directly to your board — no email, no Notion. Vote counts tell you exactly which problems are blocking the most users.",
    Mockup: BoardMockup,
  },
  {
    step: "02",
    heading: "Your roadmap updates itself.",
    caption:
      "Change a post status and it appears on your public roadmap instantly. No separate tool to maintain. No manual sync.",
    Mockup: RoadmapMockup,
  },
  {
    step: "03",
    heading: "Ship with a story.",
    caption:
      "Write a changelog entry and link it to the posts you shipped. Your users see what changed and why.",
    Mockup: ChangelogMockup,
  },
  {
    step: "04",
    heading: "Every voter hears from you.",
    caption:
      "Publishing a changelog entry automatically notifies everyone who voted for the linked posts. The loop closes without any manual work.",
    Mockup: EmailMockup,
  },
] as const;

/* ─── Section ──────────────────────────────────────────────────────── */

export function ProductTour() {
  return (
    <section className="bg-background" id="how-it-works">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <p className="font-bold text-xs uppercase tracking-eyebrow text-success">
          Product Tour
        </p>

        <h2 className="mt-4 font-bold text-3xl text-foreground sm:text-4xl">
          From idea to inbox, in one place.
        </h2>

        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Everything that happens between a user submitting a request and
          receiving a notification that it shipped.
        </p>

        <div className="mt-16 divide-y divide-border border-t border-border">
          {FRAMES.map(({ step, heading, caption, Mockup }) => (
            <div
              className="grid gap-8 py-12 lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-16"
              key={step}
            >
              {/* Caption */}
              <div className="lg:pt-2">
                <span className="font-mono text-2xs text-muted-foreground">
                  {step}
                </span>
                <h3 className="mt-2 font-bold text-xl text-foreground">
                  {heading}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {caption}
                </p>
              </div>
              {/* Mockup */}
              <Mockup />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
