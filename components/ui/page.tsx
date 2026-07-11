import type { ReactNode } from "react";
import { OpenPortalButton } from "@/components/workspace/open-portal-button";
import { cn } from "@/lib/utils";

// ─── Shared page layout system ────────────────────────────────────────────────
// One place that defines the app's content width, padding, and header so every
// page reads as the same design system. Use PageShell for a full page
// (header + scrollable body), or compose PageHeader + ContentContainer/PageBody
// directly. Reference: the Account/Settings pages.

// Standard horizontal + vertical page padding, applied by every wrapper here.
export const PAGE_PADDING = "px-4 py-3 sm:px-8";

interface PageHeaderProps {
  actions?: ReactNode;
  // Rendered before the "Open Public Portal" button (e.g. a search box that
  // needs to lead the action cluster) — OpenPortalButton itself always comes
  // right after, with `actions` last.
  beforeActions?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
}

// Full-width header bar with a bottom border. Title sits at the same left inset
// as the content below it, so headers and content share a left edge. Sticky so
// it stays visible while the page's content scrolls beneath it — a no-op on
// pages where it already sits outside the scrolling area (e.g. PageShell).
export function PageHeader({
  title,
  description,
  beforeActions,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 border-b border-ir-border bg-background",
        PAGE_PADDING,
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ir-heading">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-ir-muted">{description}</p>
          )}
        </div>
        {/* Page-specific actions sit to the right; the shared "Open Public
            Portal" button is prepended so it appears consistently on every page
            that uses this header (renders nothing if there's no public portal). */}
        <div className="flex shrink-0 items-center gap-2">
          {beforeActions}
          <OpenPortalButton />
          {actions}
        </div>
      </div>
    </div>
  );
}

interface ContentContainerProps {
  className?: string;
  children: ReactNode;
}

// The single, consistent reading/form column used across the product — post
// detail, editors, settings forms, notifications, etc. Centered with a fixed
// max width so every full-page form lines up at the same width regardless of
// viewport size. Data-heavy pages (tables, dashboards, kanban) use PageBody
// instead so they can fill the available width.
export function ContentContainer({ className, children }: ContentContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl", PAGE_PADDING, className)}>
      {children}
    </div>
  );
}

interface PageBodyProps {
  className?: string;
  children: ReactNode;
}

// Full-width content region with the standard page padding — for data-heavy
// pages (tables, dashboards, kanban) that should fill the pane.
export function PageBody({ className, children }: PageBodyProps) {
  return <div className={cn(PAGE_PADDING, className)}>{children}</div>;
}

interface PageShellProps {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}

// A whole page: fixed header + independently scrolling body. The body area is
// full-height so long content scrolls under a pinned header (matches the
// settings pages). Pass page content already wrapped in ContentContainer or
// PageBody.
export function PageShell({
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader actions={actions} description={description} title={title} />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
