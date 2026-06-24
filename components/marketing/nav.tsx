import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { NavFeaturesDropdown } from "@/components/marketing/nav-features-dropdown";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src={LOGO_PATH}
            alt={PRODUCT_NAME}
            width={500}
            height={164}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav
          aria-label="Site navigation"
          className="hidden items-center gap-1 md:flex"
        >
          <NavFeaturesDropdown />

          <Link
            href="/demo"
            className="rounded-none px-3 py-2 text-xs font-semibold uppercase tracking-ui text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            Demo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden sm:inline-flex"
            size="sm"
            variant="ghost"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Start Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
