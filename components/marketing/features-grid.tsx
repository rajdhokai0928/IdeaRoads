import {
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  ChevronUp,
  LayoutGrid,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

type Feature = {
  icon: typeof LayoutGrid;
  title: string;
  description: string;
  wide?: boolean;
  accent?: string;
};

const FEATURES: Feature[] = [
  {
    icon: LayoutGrid,
    title: "Feedback Boards",
    description:
      "Users submit requests directly — no more ideas buried in your inbox or scattered across Slack and Notion. Organize them into public or private boards.",
    wide: true,
    accent: "from-brand-50 to-surface",
  },
  {
    icon: ArrowUp,
    title: "Voting",
    description:
      "Know exactly which problems block the most users, ranked by real signal — not by who emailed you last.",
  },
  {
    icon: BarChart3,
    title: "Public Roadmap",
    description:
      "Your roadmap updates automatically as you change post statuses. No separate Notion page to maintain.",
  },
  {
    icon: Users,
    title: "Team Roles",
    description:
      "Your whole team can triage feedback without sharing admin credentials. Invite by email or shareable link.",
  },
  {
    icon: BookOpen,
    title: "Changelog",
    description:
      "Every user who requested a feature gets an email the day you ship it. The loop closes automatically.",
  },
  {
    icon: Bell,
    title: "Email Notifications",
    description:
      "Users stay informed at every step — status changes, comments, and changelog updates, with one-click unsubscribe.",
    wide: true,
    accent: "from-grape-500/10 to-surface",
  },
];

function BoardPreview() {
  return (
    <div className="mt-5 hidden gap-2 sm:flex">
      {[42, 31, 24].map((v, i) => (
        <div
          className="flex flex-1 items-center gap-2 rounded-mk border border-hairline bg-surface px-2.5 py-2"
          key={v}
        >
          <span
            className={`flex flex-col items-center rounded-mk-sm px-1.5 py-0.5 text-xs font-bold ${
              i === 0 ? "bg-brand-500 text-white" : "bg-canvas-2 text-ink"
            }`}
          >
            <ChevronUp aria-hidden="true" className="size-3" />
            {v}
          </span>
          <span className="h-1.5 flex-1 rounded-full bg-hairline" />
        </div>
      ))}
    </div>
  );
}

function NotifyPreview() {
  return (
    <div className="mt-5 hidden items-center gap-3 rounded-mk-lg border border-hairline bg-surface p-3 sm:flex">
      <span className="flex size-9 items-center justify-center rounded-mk bg-brand-50 text-brand-600">
        <Bell aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">
          Your request shipped 🎉
        </p>
        <p className="text-[0.7rem] text-slate-1">Sent to 128 voters</p>
      </div>
      <span className="rounded-full bg-mint-400/15 px-2 py-0.5 text-[0.65rem] font-semibold text-mint-400">
        Auto
      </span>
    </div>
  );
}

export function FeaturesGrid() {
  return (
    <section className="bg-muted" id="features">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .feature-card {
          position: relative;
          border-radius: 1.5rem;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .feature-card::before,
        .feature-card::after {
          content: '';
          position: absolute;
          height: 2px;
          background: linear-gradient(to right, var(--color-brand-500), var(--color-brand-300));
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          width: 0;
        }
        .feature-card::before {
          top: 0;
          left: 0;
        }
        .feature-card::after {
          bottom: 0;
          right: 0;
        }
        .feature-card:hover::before,
        .feature-card:hover::after {
          width: 100%;
        }
        @media (prefers-reduced-motion: reduce) {
          .feature-card {
            transition: none;
            transform: none !important;
          }
          .feature-card::before,
          .feature-card::after {
            transition: none;
          }
        }
      `,
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <p className="font-bold text-xs uppercase tracking-eyebrow text-brand-500">
          What You Get
        </p>

        <h2 className="mt-4 font-bold text-3xl text-foreground sm:text-4xl">
          Everything a product team needs. Nothing they don't.
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              className="feature-card border border-border bg-card p-6"
              key={title}
            >
              <Icon aria-hidden="true" className="size-5 text-foreground" />
              <h3 className="mt-3 font-semibold text-base text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-1">
                {description}
              </p>
              {title === "Feedback Boards" && <BoardPreview />}
              {title === "Email Notifications" && <NotifyPreview />}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild className="btn-liquid" data-text="Start Free">
            <Link href="/login">Start Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
