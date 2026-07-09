import { PageHeader } from "@/components/ui/page";
import { SettingsTabs } from "./_components/settings-tabs";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function MembersSettingsLayout({
  children,
  params,
}: Props) {
  const { slug } = await params;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        description="Manage workspace membership and invitations."
        title="Team Members"
      />
      <SettingsTabs slug={slug} />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
