"use client";

import { ExternalLink } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

// The current workspace's public-portal URL, resolved once in the workspace
// layout and shared with every page header so the "Open Public Portal" button
// can appear app-wide without each page recomputing it. `null` when the
// workspace has nothing public to open (no button is shown).
const PortalHrefContext = createContext<string | null>(null);

export function PortalHrefProvider({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  return (
    <PortalHrefContext.Provider value={href}>
      {children}
    </PortalHrefContext.Provider>
  );
}

export function usePortalHref() {
  return useContext(PortalHrefContext);
}

// Opens the workspace's public portal in a new tab. Rendered inside PageHeader,
// so it shows up automatically on every admin page that uses the shared header.
// Renders nothing when there's no public surface to open. The label collapses
// to an icon-only control on mobile to stay compact in the header.
export function OpenPortalButton() {
  const href = usePortalHref();
  if (!href) {
    return null;
  }
  return (
    <a
      aria-label="Open Public Portal"
      className="flex items-center gap-1.5 border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3.5"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ExternalLink className="size-4 shrink-0" />
      <span className="hidden sm:inline">Open Public Portal</span>
    </a>
  );
}
