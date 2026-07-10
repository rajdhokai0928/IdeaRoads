"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const invitesHref = `/${slug}/settings/members/invites`;
  const membersHref = `/${slug}/settings/members`;

  const tabs = [
    { label: "Members", href: membersHref },
    { label: "Invites", href: invitesHref },
  ];

  return (
    <div className="flex gap-1 border-b border-ir-border px-4 sm:px-8">
      {tabs.map((tab) => {
        const isActive =
          tab.href === invitesHref
            ? pathname.startsWith(invitesHref)
            : pathname === membersHref || !pathname.startsWith(invitesHref);
        return (
          <Link
            className={`-mb-px rounded-t-ir-sm border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-ir-standard ${
              isActive
                ? "border-ir-primary text-ir-primary"
                : "border-transparent text-ir-muted hover:text-ir-heading"
            }`}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
