import { Rss } from "lucide-react";
import Link from "next/link";
import { SquareAvatar } from "@/components/ui/square-avatar";

interface Board {
  id: string;
  name: string;
  slug: string;
}

interface PortalHeaderProps {
  active?: "roadmap" | "changelog";
  boards: Board[];
  changelogPublic: boolean;
  currentPath?: string;
  isMember?: boolean;
  isSignedIn: boolean;
  logoUrl?: string | null;
  roadmapPublic: boolean;
  rssHref?: string;
  slug: string;
  userEmail?: string | null;
  userImage?: string | null;
  userName?: string | null;
  workspaceName: string;
}

/**
 * Public-facing header for a brand's feedback portal (board, post, roadmap,
 * changelog, profile pages). Reading is open to anyone; signed-in people get
 * a profile avatar (linking to their profile page), members additionally get
 * a link back to their admin dashboard; visitors get a sign-in link.
 * Participation (vote/comment/submit) is gated elsewhere.
 */
export function PortalHeader({
  slug,
  workspaceName,
  logoUrl,
  boards,
  roadmapPublic,
  changelogPublic,
  isSignedIn,
  isMember = false,
  userImage,
  userName,
  userEmail,
  active,
  rssHref,
  currentPath,
}: PortalHeaderProps) {
  const profileFallback = (userName || userEmail || "?")
    .charAt(0)
    .toUpperCase();
  const navLinkClass =
    "px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";
  const activeLinkClass =
    "px-3 py-1.5 text-sm font-medium text-foreground border-b-2 border-foreground";

  const homeHref = boards[0] ? `/${slug}/b/${boards[0].slug}` : `/${slug}`;
  const signInHref = currentPath
    ? `/signin?next=${encodeURIComponent(currentPath)}`
    : "/signin";

  return (
    <header className="border-b border-border bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
            href={homeHref}
          >
            <SquareAvatar
              alt={workspaceName}
              className="size-7"
              fallback={workspaceName.charAt(0).toUpperCase()}
              imageUrl={logoUrl}
            />
            {workspaceName}
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {(roadmapPublic || isMember) && (
              <Link
                className={
                  active === "roadmap" ? activeLinkClass : navLinkClass
                }
                href={`/${slug}/roadmap`}
              >
                Roadmap
              </Link>
            )}
            {(changelogPublic || isMember) && (
              <Link
                className={
                  active === "changelog" ? activeLinkClass : navLinkClass
                }
                href={`/${slug}/changelog`}
              >
                Changelog
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              {isMember && (
                <Link
                  className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  href={`/${slug}`}
                >
                  Dashboard
                </Link>
              )}
              <Link aria-label="My profile" href={`/${slug}/profile`}>
                <SquareAvatar
                  alt={userName ?? "My profile"}
                  className="size-9"
                  fallback={profileFallback}
                  imageUrl={userImage}
                />
              </Link>
            </>
          ) : (
            <Link
              className="px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
              href={signInHref}
            >
              Sign In / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
