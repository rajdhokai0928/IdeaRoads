import { ArrowRight, Settings2, Users } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

const BOARDS: {
  name: string;
  posts: number;
  activity: string;
  lead?: boolean;
}[] = [
  {
    name: "Feature Requests",
    posts: 48,
    activity: "Updated 2h ago",
    lead: true,
  },
  { name: "Bug Reports", posts: 12, activity: "Updated 1d ago" },
  { name: "Design Feedback", posts: 7, activity: "Updated 3d ago" },
];

function WorkspaceMockup() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-mk-xl border border-hairline bg-surface shadow-mk-lg"
    >
      <div className="flex items-center gap-3 border-b border-hairline bg-canvas-2/70 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-hairline-strong" />
          <span className="size-2.5 rounded-full bg-hairline-strong" />
          <span className="size-2.5 rounded-full bg-hairline-strong" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-mk-sm border border-hairline bg-surface px-3 py-1">
          <span className="size-1.5 rounded-full bg-mint-400" />
          <span className="text-xs text-slate-1">app.idearoads.com</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-mk bg-linear-to-br from-brand-500 to-grape-500 text-sm font-bold text-white">
            A
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Acme Corp</p>
            <p className="text-xs text-slate-1">Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-1">
          <Users aria-hidden="true" className="size-4" />
          <Settings2 aria-hidden="true" className="size-4" />
        </div>
      </div>

      <div className="flex items-center justify-between border-y border-hairline px-5 py-3">
        <span className="text-sm font-semibold text-ink">Boards</span>
        <span className="mk-btn-fill rounded-mk-sm px-2.5 py-1 text-xs font-semibold text-white">
          + New Board
        </span>
      </div>

      <div className="divide-y divide-hairline">
        {BOARDS.map(({ name, posts, activity, lead }) => (
          <div
            className="flex items-center justify-between px-5 py-3.5"
            key={name}
          >
            <div>
              <p className="text-sm font-medium text-ink">{name}</p>
              <p className="mt-0.5 text-xs text-slate-1">
                {posts} posts · {activity}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                lead ? "bg-brand-50 text-brand-700" : "bg-canvas-2 text-slate-1"
              }`}
            >
              {posts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveDemo() {
  return (
    <section className="bg-canvas-2">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-lg">
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50/70 px-3 py-1 text-xs font-semibold text-brand-700">
              See it live
            </span>
            <h2 className="mk-display mt-5 text-3xl font-bold text-ink sm:text-4xl">
              One workspace for your whole team.
            </h2>

            <p className="mt-3 text-lg text-muted-foreground">
              Your team gets a workspace dashboard to manage boards, triage
              posts, and track everything in one place — while users see a
              clean, branded feedback portal.
            </p>

            <div className="mt-8">
              <Button
                asChild
                className="btn-liquid"
                data-text="Start Free"
                size="lg"
              >
                <Link href="/login">Start Free</Link>
              </Button>
            </div>
          </div>

          <div className="lg:pl-4">
            <WorkspaceMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
