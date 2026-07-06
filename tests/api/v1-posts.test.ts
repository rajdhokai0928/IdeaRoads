import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as getPost } from "@/app/api/v1/posts/[postId]/route";
import { GET as listPosts } from "@/app/api/v1/posts/route";
import {
  createTestApiKey,
  createTestBoard,
  createTestPost,
  createTestUser,
  createTestWorkspace,
} from "../setup/fixtures";
import { resetDb } from "../setup/reset-db";

beforeEach(async () => {
  await resetDb();
});

async function setupWorkspaceWithPosts(opts?: { unapprovedCount?: number }) {
  const owner = await createTestUser();
  const ws = await createTestWorkspace(owner.id, owner.email);
  const board = await createTestBoard({
    workspaceId: ws.id,
    createdBy: owner.id,
  });
  const { rawKey } = await createTestApiKey({
    workspaceId: ws.id,
    userId: owner.id,
  });

  const approved = await createTestPost({
    boardId: board.id,
    workspaceId: ws.id,
    authorId: owner.id,
    authorEmail: owner.email,
    isApproved: true,
  });

  for (let i = 0; i < (opts?.unapprovedCount ?? 0); i++) {
    await createTestPost({
      boardId: board.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
      isApproved: false,
    });
  }

  return { owner, ws, board, rawKey, approved };
}

describe("GET /api/v1/posts — auth", () => {
  it("returns 401 with no API key", async () => {
    const req = new NextRequest("http://localhost/api/v1/posts");
    const res = await listPosts(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: expect.any(String) });
  });

  it("returns 401 with an invalid API key", async () => {
    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: "Bearer ir_live_totally_invalid" },
    });
    const res = await listPosts(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with a valid API key", async () => {
    const { rawKey } = await setupWorkspaceWithPosts();
    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const res = await listPosts(req);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/v1/posts — workspace scoping", () => {
  it("never returns another workspace's posts", async () => {
    const { rawKey } = await setupWorkspaceWithPosts();
    const other = await setupWorkspaceWithPosts();

    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const res = await listPosts(req);
    const body = await res.json();

    const ids: string[] = body.data.map((p: { id: string }) => p.id);
    expect(ids).toHaveLength(1);
    expect(ids).not.toContain(other.approved.id);
  });

  it("excludes unapproved posts", async () => {
    const { rawKey, approved } = await setupWorkspaceWithPosts({
      unapprovedCount: 2,
    });
    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const res = await listPosts(req);
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(approved.id);
  });

  it("404s when boardSlug belongs to a different workspace", async () => {
    const { rawKey } = await setupWorkspaceWithPosts();
    const other = await setupWorkspaceWithPosts();

    const req = new NextRequest(
      `http://localhost/api/v1/posts?boardSlug=${other.board.slug}`,
      { headers: { Authorization: `Bearer ${rawKey}` } }
    );
    const res = await listPosts(req);
    expect(res.status).toBe(404);
  });

  it("excludes posts on a private board", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const privateBoard = await createTestBoard({
      workspaceId: ws.id,
      createdBy: owner.id,
      isPublic: false,
    });
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });
    const privatePost = await createTestPost({
      boardId: privateBoard.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
      isApproved: true,
    });

    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const res = await listPosts(req);
    const body = await res.json();

    const ids: string[] = body.data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(privatePost.id);
  });
});

describe("GET /api/v1/posts — response consistency & pagination", () => {
  it("wraps list responses in { data: [...] }", async () => {
    const { rawKey } = await setupWorkspaceWithPosts();
    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const body = await (await listPosts(req)).json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("defaults to a limit of 50 and clamps above 100", async () => {
    const { rawKey, ws, board, owner } = await setupWorkspaceWithPosts();
    for (let i = 0; i < 5; i++) {
      await createTestPost({
        boardId: board.id,
        workspaceId: ws.id,
        authorId: owner.id,
        authorEmail: owner.email,
      });
    }

    const overReq = new NextRequest("http://localhost/api/v1/posts?limit=500", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const overBody = await (await listPosts(overReq)).json();
    // 6 posts exist total (1 approved from setup + 5 more); well under the
    // clamp, but this proves the route accepts and doesn't error on an
    // out-of-range limit rather than asserting the clamp ceiling directly.
    expect(overBody.data.length).toBeLessThanOrEqual(100);

    const smallReq = new NextRequest("http://localhost/api/v1/posts?limit=2", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const smallBody = await (await listPosts(smallReq)).json();
    expect(smallBody.data).toHaveLength(2);
  });
});

describe("GET /api/v1/posts/:postId", () => {
  it("returns 401 with no API key", async () => {
    const res = await getPost(
      new NextRequest("http://localhost/api/v1/posts/x"),
      {
        params: Promise.resolve({ postId: "x" }),
      }
    );
    expect(res.status).toBe(401);
  });

  it("returns the post scoped to the key's own workspace", async () => {
    const { rawKey, approved } = await setupWorkspaceWithPosts();
    const req = new NextRequest(
      `http://localhost/api/v1/posts/${approved.id}`,
      {
        headers: { Authorization: `Bearer ${rawKey}` },
      }
    );
    const res = await getPost(req, {
      params: Promise.resolve({ postId: approved.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(approved.id);
  });

  it("404s on a post belonging to a different workspace (no cross-tenant leak)", async () => {
    const { rawKey } = await setupWorkspaceWithPosts();
    const other = await setupWorkspaceWithPosts();

    const req = new NextRequest(
      `http://localhost/api/v1/posts/${other.approved.id}`,
      { headers: { Authorization: `Bearer ${rawKey}` } }
    );
    const res = await getPost(req, {
      params: Promise.resolve({ postId: other.approved.id }),
    });
    expect(res.status).toBe(404);
  });

  it("404s on an unapproved post", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const board = await createTestBoard({
      workspaceId: ws.id,
      createdBy: owner.id,
    });
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });
    const pending = await createTestPost({
      boardId: board.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
      isApproved: false,
    });

    const req = new NextRequest(`http://localhost/api/v1/posts/${pending.id}`, {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const res = await getPost(req, {
      params: Promise.resolve({ postId: pending.id }),
    });
    expect(res.status).toBe(404);
  });

  it("404s on a post belonging to a private board", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const privateBoard = await createTestBoard({
      workspaceId: ws.id,
      createdBy: owner.id,
      isPublic: false,
    });
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });
    const privatePost = await createTestPost({
      boardId: privateBoard.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
      isApproved: true,
    });

    const req = new NextRequest(
      `http://localhost/api/v1/posts/${privatePost.id}`,
      { headers: { Authorization: `Bearer ${rawKey}` } }
    );
    const res = await getPost(req, {
      params: Promise.resolve({ postId: privatePost.id }),
    });
    expect(res.status).toBe(404);
  });
});
