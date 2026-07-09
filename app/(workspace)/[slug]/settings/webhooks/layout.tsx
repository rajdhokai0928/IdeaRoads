import { PageShell } from "@/components/ui/page";

interface Props {
  children: React.ReactNode;
}

export default function WebhooksSettingsLayout({ children }: Props) {
  return (
    <PageShell
      description="Send real-time events to your own systems via HTTPS webhooks."
      title="Webhooks"
    >
      {children}
    </PageShell>
  );
}
