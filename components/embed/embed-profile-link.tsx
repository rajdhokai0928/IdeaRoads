"use client";

import { UserIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIsEmbed } from "./use-is-embed";

interface EmbedProfileLinkProps {
  slug: string;
}

// PortalHeader (and its "My profile" avatar link) is hidden inside the
// widget, so signed-in embed visitors otherwise have no way to reach
// /profile at all. Renders nothing outside the embed — the header link
// already covers that case there.
export function EmbedProfileLink({ slug }: EmbedProfileLinkProps) {
  const isEmbed = useIsEmbed();
  const searchParams = useSearchParams();

  if (!isEmbed) {
    return null;
  }

  const qs = searchParams.toString();

  return (
    <Link
      className="flex items-center gap-2 rounded-ir-sm px-3 py-2 text-sm text-ir-body transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface"
      href={`/${slug}/profile${qs ? `?${qs}` : ""}`}
    >
      <UserIcon className="size-4" />
      My Profile
    </Link>
  );
}
