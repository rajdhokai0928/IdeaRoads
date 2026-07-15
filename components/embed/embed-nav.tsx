import { UserIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface Board {
  slug: string;
}

interface EmbedNavProps {
  active?: "feedback" | "roadmap" | "changelog" | "profile";
  boards: Board[];
  changelogPublic: boolean;
  embedQuery: string;
  isSignedIn: boolean;
  roadmapPublic: boolean;
  slug: string;
}

/**
 * Cross-section tab bar shown in place of PortalHeader while embedded — the
 * widget hides all normal nav chrome, so without this a visitor has no way
 * to move between Feedback/Roadmap/Changelog/Profile once inside it.
 */
export function EmbedNav({
  active,
  boards,
  changelogPublic,
  embedQuery,
  isSignedIn,
  roadmapPublic,
  slug,
}: EmbedNavProps) {
  const navLinkClass =
    "rounded-ir-sm px-2.5 py-1.5 text-sm font-medium text-ir-muted transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface hover:text-ir-heading";
  const activeLinkClass =
    "rounded-ir-sm px-2.5 py-1.5 text-sm font-medium text-ir-primary bg-ir-primary-light/15";

  return (
    <header className="border-b border-ir-border bg-ir-surface">
      <nav className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">
          {boards[0] && (
            <Link
              className={active === "feedback" ? activeLinkClass : navLinkClass}
              href={`/${slug}/b/${boards[0].slug}${embedQuery}`}
            >
              Feedback
            </Link>
          )}
          {roadmapPublic && (
            <Link
              className={active === "roadmap" ? activeLinkClass : navLinkClass}
              href={`/${slug}/roadmap${embedQuery}`}
            >
              Roadmap
            </Link>
          )}
          {changelogPublic && (
            <Link
              className={
                active === "changelog" ? activeLinkClass : navLinkClass
              }
              href={`/${slug}/changelog${embedQuery}`}
            >
              Changelog
            </Link>
          )}
        </div>
        {isSignedIn && (
          <Link
            aria-label="My profile"
            className={`shrink-0 ${active === "profile" ? "text-ir-primary" : "text-ir-muted hover:text-ir-heading"} rounded-ir-full p-1.5 transition-colors duration-150 ease-ir-standard`}
            href={`/${slug}/profile${embedQuery}`}
          >
            <UserIcon
              className="size-4"
              weight={active === "profile" ? "fill" : "regular"}
            />
          </Link>
        )}
      </nav>
    </header>
  );
}
