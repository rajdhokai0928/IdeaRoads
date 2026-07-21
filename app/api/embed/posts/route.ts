import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/authz";
import { submitFeedback } from "@/lib/posts/submit-feedback";

// Bearer-authenticated equivalent of createPostAction (app/actions/posts.ts)
// for the embed widget, whose iframe can't attach a header to a Server
// Action invocation. Same business logic (lib/posts/submit-feedback.ts),
// same getCurrentSession() — this route exists only because the auth
// header needs a route to land on, not because the logic differs.
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = await submitFeedback(session.user, body);

  if (!result.ok) {
    const status = result.code === "BLOCKED" ? 403 : 400;
    return NextResponse.json(
      { error: result.error, field: result.field },
      { status }
    );
  }

  return NextResponse.json(
    {
      postId: result.data.postId,
      postSlug: result.data.postSlug,
      isPending: result.data.isPending,
      isDraft: result.data.isDraft,
    },
    { status: 201 }
  );
}
