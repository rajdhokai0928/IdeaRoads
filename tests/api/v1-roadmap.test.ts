import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as getRoadmap } from "@/app/api/v1/roadmap/route";
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

describe("GET /api/v1/roadmap — auth", () => {
  it("returns 401 with no API key", async () => {
    const res = await getRoadmap(
      new NextRequest("http://localhost/api/v1/roadmap")
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/roadmap — workspace scoping & shape", () => {
  it("groups posts by status and excludes private boards", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const publicBoard = await createTestBoard({
      workspaceId: ws.id,
      createdBy: owner.id,
      isPublic: true,
    });
    const privateBoard = await createTestBoard({
      workspaceId: ws.id,
      createdBy: owner.id,
      isPublic: false,
    });
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });

    const planned = await createTestPost({
      boardId: publicBoard.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
      status: "planned",
    });
    await createTestPost({
      boardId: privateBoard.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
      status: "planned",
    });
    // A post that isn't on the roadmap at all (default "open" status)
    await createTestPost({
      boardId: publicBoard.id,
      workspaceId: ws.id,
      authorId: owner.id,
      authorEmail: owner.email,
    });

    const req = new NextRequest("http://localhost/api/v1/roadmap", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const body = await (await getRoadmap(req)).json();

    expect(body.data).toHaveProperty("planned");
    expect(body.data).toHaveProperty("in_progress");
    expect(body.data).toHaveProperty("completed");
    expect(body.data.planned.map((p: { id: string }) => p.id)).toEqual([
      planned.id,
    ]);
    expect(body.data.in_progress).toEqual([]);
    expect(body.data.completed).toEqual([]);
  });

  it("never returns another workspace's roadmap posts", async () => {
    const ownerA = await createTestUser();
    const wsA = await createTestWorkspace(ownerA.id, ownerA.email);
    const boardA = await createTestBoard({
      workspaceId: wsA.id,
      createdBy: ownerA.id,
    });
    const { rawKey: keyA } = await createTestApiKey({
      workspaceId: wsA.id,
      userId: ownerA.id,
    });

    const ownerB = await createTestUser();
    const wsB = await createTestWorkspace(ownerB.id, ownerB.email);
    const boardB = await createTestBoard({
      workspaceId: wsB.id,
      createdBy: ownerB.id,
    });
    await createTestPost({
      boardId: boardB.id,
      workspaceId: wsB.id,
      authorId: ownerB.id,
      authorEmail: ownerB.email,
      status: "planned",
    });

    await createTestPost({
      boardId: boardA.id,
      workspaceId: wsA.id,
      authorId: ownerA.id,
      authorEmail: ownerA.email,
      status: "planned",
    });

    const req = new NextRequest("http://localhost/api/v1/roadmap", {
      headers: { Authorization: `Bearer ${keyA}` },
    });
    const body = await (await getRoadmap(req)).json();
    expect(body.data.planned).toHaveLength(1);
  });
});
