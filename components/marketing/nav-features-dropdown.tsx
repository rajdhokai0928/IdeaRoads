"use client";

import {
  BookOpenIcon,
  CaretDownIcon,
  ChartBarIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const FEATURE_LINKS = [
  {
    icon: SquaresFourIcon,
    label: "Feedback Boards",
    tagline: "One place for every feature request",
    href: "/features/feedback-boards",
  },
  {
    icon: ChartBarIcon,
    label: "Public Roadmap",
    tagline: "Your roadmap updates itself",
    href: "/features/roadmap",
  },
  {
    icon: BookOpenIcon,
    label: "Changelog",
    tagline: "Every voter hears from you automatically",
    href: "/features/changelog",
  },
] as const;

export function NavFeaturesDropdown() {
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-ir-sm px-3 py-2 text-xs font-semibold tracking-ui text-ir-muted uppercase transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface hover:text-ir-heading"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
          if (e.key === "Enter" || e.key === " ") {
            setOpen((v) => !v);
          }
        }}
        type="button"
      >
        Features
        <CaretDownIcon
          aria-hidden="true"
          className={`size-3.5 transition-transform duration-150 ease-ir-standard ${open ? "-rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel — same fade/zoom treatment as the app's Radix-based
          overlays (Select/DropdownMenu/Popover), so it feels like the same
          dropdown system despite being hover-triggered rather than click. */}
      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-full left-0 z-50 mt-2 w-72 origin-top-left rounded-ir-md border border-ir-border bg-ir-surface shadow-ir-lg"
            exit={
              shouldReduceMotion
                ? undefined
                : { opacity: 0, scale: 0.95, y: -4 }
            }
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: -4 }
            }
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {/* Feature links */}
            <div className="p-1.5">
              {FEATURE_LINKS.map(({ icon: Icon, label, tagline, href }) => (
                <Link
                  className="flex items-start gap-3 rounded-ir-sm px-3 py-3 transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface"
                  href={href}
                  key={label}
                  onClick={() => setOpen(false)}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-ir-sm bg-ir-primary-light/15 text-ir-primary">
                    <Icon aria-hidden="true" className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ir-heading">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-ir-muted">
                      {tagline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer link */}
            <div className="border-t border-ir-border px-4 py-3">
              <Link
                className="text-xs font-semibold tracking-ui text-ir-muted uppercase transition-colors duration-150 ease-ir-standard hover:text-ir-heading"
                href="/features"
                onClick={() => setOpen(false)}
              >
                All Features →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
