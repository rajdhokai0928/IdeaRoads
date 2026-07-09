import { PageShell } from "@/components/ui/page";

interface Props {
  children: React.ReactNode;
}

export default function GeneralSettingsLayout({ children }: Props) {
  return (
    <PageShell
      description="Manage workspace-wide settings and visibility."
      title="General"
    >
      {children}
    </PageShell>
  );
}
