import { Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroMockup } from "@/components/marketing/hero-mockup";

const AVATARS = [
  { initials: "AM", tint: "from-brand-500 to-grape-500" },
  { initials: "RK", tint: "from-grape-500 to-brand-600" },
  { initials: "JD", tint: "from-sun-400 to-brand-500" },
  { initials: "SL", tint: "from-mint-400 to-brand-500" },
] as const;

export function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14 sm:pb-32">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <div>
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .word-flip-container {
                position: relative;
                display: inline-flex;
                flex-direction: column;
                overflow: hidden;
                height: 1.15em;
                vertical-align: -0.15em;
              }
              .word-flip-list {
                display: flex;
                flex-direction: column;
                white-space: nowrap;
                animation: word-flip 9s cubic-bezier(0.76, 0, 0.24, 1) infinite;
              }
              .word-flip-item {
                height: 1.15em;
                display: flex;
                align-items: center;
              }
              @keyframes word-flip {
                0% { transform: translateY(0); }
                28% { transform: translateY(0); }
                33% { transform: translateY(-1.15em); }
                61% { transform: translateY(-1.15em); }
                66% { transform: translateY(-2.3em); }
                94% { transform: translateY(-2.3em); }
                99% { transform: translateY(-3.45em); }
                100% { transform: translateY(-3.45em); }
              }
              @media (prefers-reduced-motion: reduce) {
                .word-flip-list {
                  animation: none;
                }
              }
            `,
              }}
            />
            <h1 className="font-black text-5xl tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              Ship what your users actually{" "}
              <span className="word-flip-container text-brand-400">
                <span className="word-flip-list">
                  <span className="word-flip-item">want.</span>
                  <span className="word-flip-item">need.</span>
                  <span className="word-flip-item">value.</span>
                  <span className="word-flip-item">want.</span>
                </span>
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-ink-soft">
              Collect feedback, let users vote on priorities, publish a public
              roadmap, and automatically notify every voter the moment you ship.
              One platform that closes the loop.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="btn-liquid"
                data-text="Start Free"
                size="lg"
              >
                <Link href="/login">Start Free</Link>
              </Button>
              <Button
                asChild
                className="btn-liquid"
                data-text="View Demo"
                size="lg"
                variant="outline"
              >
                <Link href="#how-it-works">View Demo</Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {AVATARS.map(({ initials, tint }) => (
                    <span
                      className={`flex size-9 items-center justify-center rounded-full bg-linear-to-br ring-2 ring-canvas ${tint} text-[0.65rem] font-bold text-white`}
                      key={initials}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    2,000+ product teams
                  </p>
                  <p className="text-xs text-slate-1">collect feedback here</p>
                </div>
              </div>

              <div className="h-9 w-px bg-hairline" />

              <div>
                <div className="flex items-center gap-0.5 text-sun-400">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      aria-hidden="true"
                      className="size-4 fill-current"
                      key={i}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-1">
                  Loved by makers & teams
                </p>
              </div>
            </div>
          </div>

          {/* Product visual */}
          <div className="relative lg:pl-6">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
