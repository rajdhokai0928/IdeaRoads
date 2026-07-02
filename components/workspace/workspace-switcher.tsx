"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SquareAvatar } from "@/components/ui/square-avatar";

interface WorkspaceOption {
  logoUrl: string | null;
  name: string;
  slug: string;
}

interface WorkspaceSwitcherProps {
  currentLogoUrl: string | null;
  currentName: string;
  currentSlug: string;
  workspaces: WorkspaceOption[];
}

export function WorkspaceSwitcher({
  currentLogoUrl,
  currentName,
  currentSlug,
  workspaces,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 px-4 h-14 border-b border-sidebar-border text-left cursor-pointer transition-colors duration-150 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <SquareAvatar
          alt={currentName}
          className="bg-primary text-primary-foreground"
          fallback={
            <span className="text-xs font-black">
              {currentName.charAt(0).toUpperCase()}
            </span>
          }
          imageUrl={currentLogoUrl}
        />
        <span
          className="flex-1 truncate text-sm font-semibold text-sidebar-foreground"
          title={currentName}
        >
          {currentName}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/40" />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-13 z-50 overflow-hidden rounded-md border border-zinc-500 bg-zinc-800 shadow-2xl">
          <div className="max-h-64 overflow-y-auto py-1">
            {workspaces.map((ws) => {
              const isCurrent = ws.slug === currentSlug;

              return (
                <Link
                  key={ws.slug}
                  href={`/${ws.slug}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors duration-150
            ${
              isCurrent
                ? "bg-zinc-800 text-white"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
                >
                  <SquareAvatar
                    alt={ws.name}
                    className={`size-5 text-2xs font-semibold ${
                      isCurrent
                        ? "bg-zinc-500 text-white"
                        : "bg-zinc-700 text-zinc-200"
                    }`}
                    fallback={ws.name.charAt(0).toUpperCase()}
                    imageUrl={ws.logoUrl}
                  />

                  <span className="flex-1 truncate" title={ws.name}>
                    {ws.name}
                  </span>

                  {isCurrent && (
                    <Check className="size-3.5 shrink-0 text-green-400" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-zinc-700 py-1">
            <Link
              href="/onboarding?new=1"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 transition-colors duration-150 hover:bg-zinc-800 hover:text-white"
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                <Plus className="size-4" />
              </span>
              Create workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
