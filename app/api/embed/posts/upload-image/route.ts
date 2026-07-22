import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/authz";
import { uploadPostImage } from "@/lib/posts/upload-image";

// Bearer-authenticated equivalent of uploadPostImageAction
// (app/actions/posts.ts) for the embed widget — see app/api/embed/posts
// for why this exists as a Route Handler rather than reusing the action.
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("image");
  const result = await uploadPostImage(
    session.user.id,
    file instanceof File ? file : null
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
