import { PageShell } from "@/components/ui/page";

interface Props {
  children: React.ReactNode;
}

export default function AuditLogSettingsLayout({ children }: Props) {
  return (
    <PageShell
      description="A record of all actions taken in this workspace."
      title="Audit Log"
    >
      {children}
    </PageShell>
  );
}
