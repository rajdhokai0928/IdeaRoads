"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { NavFeaturesDropdown } from "@/components/marketing/nav-features-dropdown";
import { Button } from "@/components/ui/button";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { useState } from "react";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline/80 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/"
        >
          <Image
            alt={PRODUCT_NAME}
            className="h-10 w-auto"
            height={164}
            priority
            src={LOGO_PATH}
            width={500}
          />
        </Link>

        <nav
          aria-label="Site navigation"
          className="hidden items-center gap-1 md:flex"
        >
          <NavFeaturesDropdown />

          <Link
            className="rounded-none px-3 py-2 text-xs font-semibold uppercase tracking-ui text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            href="/demo"
          >
            Demo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden sm:inline-flex btn-liquid"
            data-text="Sign In"
            size="sm"
            variant="ghost"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            className="btn-liquid"
            data-text="Start Free"
            size="sm"
          >
            <Link href="/login">Start Free</Link>
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="border-t border-hairline bg-canvas md:hidden"
          id="mobile-nav"
        >
          <nav
            aria-label="Mobile"
            className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-8"
          >
            <div className="mt-2 flex flex-col gap-2 border-t border-hairline pt-4">
              <Button
                asChild
                className="btn-liquid"
                data-text="Sign In"
                size="sm"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="btn-liquid"
                data-text="Start Free"
                size="sm"
                onClick={() => setOpen(false)}
              >
                <Link href="/login">Start Free</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
