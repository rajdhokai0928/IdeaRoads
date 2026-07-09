import { PageShell } from "@/components/ui/page";

interface Props {
  children: React.ReactNode;
}

export default function ModerationSettingsLayout({ children }: Props) {
  return (
    <PageShell
      description="Manage post approval, spam filtering, and blocked users."
      title="Moderation"
    >
      {children}
    </PageShell>
  );
}
