import { PageShell } from "@/components/ui/page";

interface Props {
  children: React.ReactNode;
}

export default function ApiKeysSettingsLayout({ children }: Props) {
  return (
    <PageShell
      description="Create workspace-scoped API keys for programmatic access."
      title="API Keys"
    >
      {children}
    </PageShell>
  );
}
