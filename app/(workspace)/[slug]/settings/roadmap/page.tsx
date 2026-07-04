import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { requireSession } from "@/lib/authz";
import { listPostsForRoadmap } from "@/lib/roadmap/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  return { title: workspace ? `Roadmap — ${workspace.name}` : "Roadmap" };
}

export default async function WorkspaceRoadmapPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }

  const roadmapData = await listPostsForRoadmap(workspace.id, {
    isAdmin: true,
    userId: session.user.id,
  });

  const totalPosts =
    roadmapData.planned.length +
    roadmapData.in_progress.length +
    roadmapData.completed.length;

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-6 sm:px-8">
        <h1 className="text-xl font-semibold text-foreground">Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalPosts === 0
            ? "No items on the roadmap yet."
            : `${totalPosts} item${totalPosts === 1 ? "" : "s"} across all columns`}
        </p>
      </div>
      <div className="flex-1">
        <RoadmapBoard
          data={roadmapData}
          isAdmin={true}
          isSignedIn={true}
          useWorkspaceLinks={true}
          workspaceSlug={slug}
        />
      </div>
    </div>
  );
}
