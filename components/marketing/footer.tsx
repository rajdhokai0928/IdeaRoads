import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {LOGO_PATH, PRODUCT_NAME } from "@/config/platform";

const LINKS = [
  {
    heading: "Product",
    items: [
      { label: "All Features", href: "/features" },
      { label: "Feedback Boards", href: "/features/feedback-boards" },
      { label: "Public Roadmap", href: "/features/roadmap" },
      { label: "Changelog", href: "/features/changelog" },
      { label: "Live Demo", href: "/demo" },
    ],
  },
  
  {
    heading: "Legal",
    items: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-10 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link
              className="inline-flex rounded-mk-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              href="/"
            >
              <Image
                alt={PRODUCT_NAME}
                className="h-10 w-auto"
                height={164}
                src={LOGO_PATH}
                width={500}
              />
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-1">
              Open-source customer feedback, voting, and changelog for product
              teams. Self-hosted, MIT licensed.
            </p>
            <Link
              aria-label="GitHub"
              className="mt-5 inline-flex size-9 items-center justify-center rounded-mk border border-hairline text-ink-soft transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              rel="noopener noreferrer"
              target="_blank" href={""}            >
              <Star aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {LINKS.map(({ heading, items }) => (
            <div key={heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-2">
                {heading}
              </p>
              <ul className="mt-4 space-y-3">
                {items.map(({ label, href, ...rest }) => {
                  const isExternal = "external" in rest && rest.external;
                  return (
                    <li key={label}>
                      <Link
                        className="text-sm text-slate-1 transition-colors duration-150 hover:text-brand-700"
                        href={href}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        target={isExternal ? "_blank" : undefined}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-2">
© 2026  ideaRoads. All Rights Reserved

          </p>
          <p className="text-xs text-slate-2">Built for product teams.</p>
        </div>
      </div>
    </footer>
  );
}
