import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { apiKeys } from "@/db/schema/api-keys";
import { authenticateApiKey } from "@/lib/api-keys/auth";
import { validateApiKey } from "@/lib/api-keys/validate";
import { db } from "@/lib/db";
import {
  createTestApiKey,
  createTestUser,
  createTestWorkspace,
} from "../setup/fixtures";
import { resetDb } from "../setup/reset-db";

beforeEach(async () => {
  await resetDb();
});

describe("validateApiKey", () => {
  it("resolves the correct workspace for a valid, enabled key", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });

    const result = await validateApiKey(rawKey);
    expect(result).toEqual({ workspaceId: ws.id, userId: owner.id });
  });

  it("returns null for a key that doesn't exist", async () => {
    expect(await validateApiKey("ir_live_nonexistent")).toBeNull();
  });

  it("returns null for a disabled key", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { id, rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });
    await db
      .update(apiKeys)
      .set({ isEnabled: false })
      .where(eq(apiKeys.id, id));

    expect(await validateApiKey(rawKey)).toBeNull();
  });

  it("never matches on the raw key value directly (only its hash)", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    await createTestApiKey({ workspaceId: ws.id, userId: owner.id });

    const [row] = await db.select().from(apiKeys);
    expect(row?.tokenHash).toBeTruthy();
    // The stored hash must not equal any plausible raw key format.
    expect(row?.tokenHash.startsWith("ir_live_")).toBe(false);
  });

  it("updates lastUsedAt after a successful validation", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { id, rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });

    await validateApiKey(rawKey);
    // The update is fire-and-forget in the source; poll briefly for it to land.
    let lastUsedAt: Date | null = null;
    for (let i = 0; i < 20 && !lastUsedAt; i++) {
      await new Promise((r) => setTimeout(r, 25));
      const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
      lastUsedAt = row?.lastUsedAt ?? null;
    }
    expect(lastUsedAt).not.toBeNull();
  });
});

describe("authenticateApiKey", () => {
  it("authenticates via Authorization: Bearer", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });

    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    expect((await authenticateApiKey(req))?.workspaceId).toBe(ws.id);
  });

  it("authenticates via x-api-key", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { rawKey } = await createTestApiKey({
      workspaceId: ws.id,
      userId: owner.id,
    });

    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { "x-api-key": rawKey },
    });
    expect((await authenticateApiKey(req))?.workspaceId).toBe(ws.id);
  });

  it("prefers Authorization: Bearer over x-api-key when both are present", async () => {
    const owner = await createTestUser();
    const wsA = await createTestWorkspace(owner.id, owner.email);
    const wsB = await createTestWorkspace(owner.id, owner.email);
    const keyA = await createTestApiKey({
      workspaceId: wsA.id,
      userId: owner.id,
    });
    const keyB = await createTestApiKey({
      workspaceId: wsB.id,
      userId: owner.id,
    });

    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: {
        Authorization: `Bearer ${keyA.rawKey}`,
        "x-api-key": keyB.rawKey,
      },
    });
    expect((await authenticateApiKey(req))?.workspaceId).toBe(wsA.id);
  });

  it("returns null when no key is present", async () => {
    const req = new NextRequest("http://localhost/api/v1/posts");
    expect(await authenticateApiKey(req)).toBeNull();
  });

  it("returns null for a non-Bearer Authorization header with no x-api-key fallback", async () => {
    const req = new NextRequest("http://localhost/api/v1/posts", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(await authenticateApiKey(req)).toBeNull();
  });
});
