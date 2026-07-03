import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as getChangelog } from "@/app/api/v1/changelog/route";
import {
  createTestApiKey,
  createTestChangelogEntry,
  createTestUser,
  createTestWorkspace,
} from "../setup/fixtures";
import { resetDb } from "../setup/reset-db";

beforeEach(async () => {
  await resetDb();
});

describe("GET /api/v1/changelog — auth", () => {
  it("returns 401 with no API key", async () => {
    const res = await getChangelog(
      new NextRequest("http://localhost/api/v1/changelog")
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/changelog — scoping, drafts, and response shape", () => {
  it("excludes unpublished drafts", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });

    const published = await createTestChangelogEntry({
      workspaceId: ws.id,
      createdBy: owner.id,
      published: true,
    });
    await createTestChangelogEntry({
      workspaceId: ws.id,
      createdBy: owner.id,
      published: false,
    });

    const req = new NextRequest("http://localhost/api/v1/changelog", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const body = await (await getChangelog(req)).json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(published.id);
  });

  it("never returns another workspace's entries", async () => {
    const ownerA = await createTestUser();
    const wsA = await createTestWorkspace(ownerA.id, ownerA.email);
    const { rawKey: keyA } = await createTestApiKey({
      workspaceId: wsA.id,
      userId: ownerA.id,
    });

    const ownerB = await createTestUser();
    const wsB = await createTestWorkspace(ownerB.id, ownerB.email);
    await createTestChangelogEntry({
      workspaceId: wsB.id,
      createdBy: ownerB.id,
      published: true,
    });

    const req = new NextRequest("http://localhost/api/v1/changelog", {
      headers: { Authorization: `Bearer ${keyA}` },
    });
    const body = await (await getChangelog(req)).json();
    expect(body.data).toEqual([]);
  });

  it("curates internal fields out of the response", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });
    await createTestChangelogEntry({
      workspaceId: ws.id,
      createdBy: owner.id,
      published: true,
    });

    const req = new NextRequest("http://localhost/api/v1/changelog", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const body = await (await getChangelog(req)).json();

    const entry = body.data[0];
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("title");
    expect(entry).toHaveProperty("body");
    expect(entry).toHaveProperty("label");
    expect(entry).not.toHaveProperty("workspaceId");
    expect(entry).not.toHaveProperty("createdBy");
    expect(entry).not.toHaveProperty("notifiedAt");
  });

  it("respects the limit query param", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });
    for (let i = 0; i < 3; i++) {
      await createTestChangelogEntry({
        workspaceId: ws.id,
        createdBy: owner.id,
        published: true,
      });
    }

    const req = new NextRequest("http://localhost/api/v1/changelog?limit=2", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const body = await (await getChangelog(req)).json();
    expect(body.data).toHaveLength(2);
  });
});
