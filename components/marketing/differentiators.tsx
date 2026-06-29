import { Scale, Server, Users } from "lucide-react";

const PILLARS = [
  {
    icon: Scale,
    title: "The code is yours.",
    body: "Read it, fork it, contribute to it. No black boxes, no proprietary terms. The MIT license is permanent — not a source-available bait-and-switch.",
  },
  {
    icon: Server,
    title: "Your server. Your database.",
    body: "Runs on your own infrastructure. Your feedback data stays in your PostgreSQL database, on your own server, under your control.",
  },
  {
    icon: Users,
    title: "Your users never cost you a seat.",
    body: "The people using your feedback boards are always free. Canny charges per voter. IdeaRoads doesn't, and never will.",
  },
] as const;

export function Differentiators() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <p className="font-bold text-xs uppercase tracking-eyebrow text-brand-500">
          Why Different
        </p>

        <h2 className="mt-4 font-bold text-3xl text-foreground sm:text-4xl">
          No per-voter fees. No lock-in. No black boxes.
        </h2>

        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Built on a model that stays honest as you grow. Self-hosted, MIT
          licensed, and yours to run forever.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div className="border border-border bg-card p-6" key={title}>
              <Icon aria-hidden="true" className="size-8 text-foreground" />
              <h3 className="mt-4 font-semibold text-base text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
