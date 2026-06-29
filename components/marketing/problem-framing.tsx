import React from "react";
import { Bell, BarChart2, Inbox, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Inbox,
    title: "Collect Feedback",
    description:
      "One board for every request — from email, Slack, Notion, and support — unified and ranked.",
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    glow: "from-brand-500/10",
    bar: "bg-brand-500",
    numColor: "text-brand-100",
  },
  {
    number: "02",
    icon: BarChart2,
    title: "Prioritize Smartly",
    description:
      "Users vote on what matters most. Real demand signal replaces whoever emailed loudest.",
    iconBg: "bg-grape-500/10",
    iconColor: "text-grape-500",
    glow: "from-grape-500/10",
    bar: "bg-grape-500",
    numColor: "text-grape-400/20",
  },
  {
    number: "03",
    icon: Bell,
    title: "Close the Loop",
    description:
      "Every voter gets an email the day their feature ships. Automatically. No extra work.",
    iconBg: "bg-mint-400/15",
    iconColor: "text-mint-400",
    glow: "from-mint-400/10",
    bar: "bg-mint-400",
    numColor: "text-mint-400/20",
  },
] as const;

export function ProblemFraming() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-hairline bg-canvas-2 px-3 py-1 text-xs font-semibold text-slate-1">
            How it works
          </span>
          <h2 className="mk-display mt-5 text-3xl font-bold text-ink sm:text-4xl">
            Three steps to a closed feedback loop.
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-soft">
            From scattered inbox to shipped feature — every voter notified
            automatically.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {STEPS.map(
            (
              {
                number,
                icon: Icon,
                title,
                description,
                iconBg,
                iconColor,
                glow,
                bar,
                numColor,
              },
              i
            ) => (
              <React.Fragment key={title}>
                <div className="group relative flex flex-col overflow-hidden rounded-mk-xl border border-hairline bg-surface p-7 shadow-mk-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-mk">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-linear-to-br ${glow} to-transparent`}
                  />

                  <span
                    className={`pointer-events-none absolute right-5 top-4 select-none font-mono text-6xl font-black leading-none ${numColor}`}
                  >
                    {number}
                  </span>

                  <span
                    className={`relative z-10 inline-flex size-11 items-center justify-center rounded-[0.875rem] ${iconBg} ${iconColor}`}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </span>

                  <div className="relative z-10 mt-5 flex-1">
                    <h3 className="text-lg font-bold text-ink">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-1">
                      {description}
                    </p>
                  </div>

                  <div
                    className={`relative z-10 mt-6 h-0.5 w-8 rounded-full ${bar} opacity-60 transition-all duration-500 group-hover:w-full group-hover:opacity-100`}
                  />
                </div>

                {i < STEPS.length - 1 && (
                  <div className="hidden items-center justify-center sm:flex">
                    <ArrowRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-hairline-strong"
                    />
                  </div>
                )}
              </React.Fragment>
            )
          )}
        </div>
      </div>
    </section>
  );
}
