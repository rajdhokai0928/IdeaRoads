import type { ReactNode } from "react";
import { OpenPortalButton } from "@/components/workspace/open-portal-button";
import { cn } from "@/lib/utils";

// ─── Shared page layout system ────────────────────────────────────────────────
// One place that defines the app's content width, padding, and header so every
// page reads as the same design system. Use PageShell for a full page
// (header + scrollable body), or compose PageHeader + ContentContainer/PageBody
// directly. Reference: the Account/Settings pages.

// Standard horizontal + vertical page padding, applied by every wrapper here.
const PAGE_PADDING = "px-4 py-6 sm:px-8";

interface PageHeaderProps {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
}

// Full-width header bar with a bottom border. Title sits at the same left inset
// as the content below it, so headers and content share a left edge.
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border", PAGE_PADDING, className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {/* Page-specific actions sit to the right; the shared "Open Public
            Portal" button is prepended so it appears consistently on every page
            that uses this header (renders nothing if there's no public portal). */}
        <div className="flex shrink-0 items-center gap-2">
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
// detail, editors, settings forms, notifications, etc. Left-aligned to line up
// with the page header. Data-heavy pages (tables, dashboards, kanban) use
// PageBody instead so they can fill the available width.
export function ContentContainer({ className, children }: ContentContainerProps) {
  return (
    <div className={cn("w-full max-w-3xl", PAGE_PADDING, className)}>
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
