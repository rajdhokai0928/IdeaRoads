import { PageShell } from "@/components/ui/page";

interface Props {
  children: React.ReactNode;
}

export default function EmbedSettingsLayout({ children }: Props) {
  return (
    <PageShell
      description="Add a feedback widget to your own site — inline or as a floating launcher."
      title="Embed"
    >
      {children}
    </PageShell>
  );
}
