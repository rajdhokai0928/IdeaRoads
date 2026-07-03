import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Job } from "pg-boss";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogs } from "@/db/schema/audit-logs";
import {
  outboundWebhookDeliveries,
  outboundWebhookEndpoints,
} from "@/db/schema/webhooks";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encrypt";
import { getWebhookEndpoint } from "@/lib/webhooks/queries";
import { handleDeliverOutboundWebhook } from "@/lib/worker/handlers/deliver-outbound-webhook";
import type { DeliverOutboundWebhookPayload } from "@/lib/worker/job-types";
import {
  createTestUser,
  createTestWebhookEndpoint,
  createTestWorkspace,
} from "../setup/fixtures";
import { resetDb } from "../setup/reset-db";

beforeEach(async () => {
  await resetDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeJob(deliveryId: string): Job<DeliverOutboundWebhookPayload> {
  return {
    id: "test-job-id",
    name: "webhooks.deliver",
    data: { deliveryId },
    expireInSeconds: 60,
    heartbeatSeconds: null,
    signal: new AbortController().signal,
  };
}

async function insertDelivery(endpointId: string, event = "post.created") {
  const [row] = await db
    .insert(outboundWebhookDeliveries)
    .values({
      endpointId,
      event,
      payload: { hello: "world" },
      status: "pending",
    })
    .returning();
  return row!;
}

async function getDelivery(deliveryId: string) {
  const [row] = await db
    .select()
    .from(outboundWebhookDeliveries)
    .where(eq(outboundWebhookDeliveries.id, deliveryId));
  return row;
}

describe("handleDeliverOutboundWebhook — HMAC signing", () => {
  it("signs the request with a verifiable HMAC-SHA256 signature", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint, rawSecret } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });
    const delivery = await insertDelivery(endpoint.id);

    let capturedHeaders: Headers | undefined;
    let capturedBody: string | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedHeaders = new Headers(init.headers);
        capturedBody = init.body as string;
        return new Response("ok", { status: 200 });
      })
    );

    await handleDeliverOutboundWebhook([makeJob(delivery.id)]);

    const signatureHeader = capturedHeaders?.get("X-IdeaRoads-Signature");
    expect(signatureHeader).toBeTruthy();

    const [, tsPart, hmacPart] =
      signatureHeader!.match(/^t=(\d+),v1=([0-9a-f]+)$/) ?? [];
    expect(tsPart).toBeTruthy();
    expect(hmacPart).toBeTruthy();

    const expectedHmac = createHmac("sha256", rawSecret)
      .update(`${tsPart}.${capturedBody}`)
      .digest("hex");
    expect(hmacPart).toBe(expectedHmac);
  });

  it("stores the secret encrypted, never in plaintext", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint, rawSecret } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });

    expect(endpoint.encryptedSecret).not.toBe(rawSecret);
    expect(decrypt(endpoint.encryptedSecret)).toBe(rawSecret);
  });
});

describe("handleDeliverOutboundWebhook — success", () => {
  it("marks the delivery delivered and resets the failure count", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });
    await db
      .update(outboundWebhookEndpoints)
      .set({ consecutiveFailures: 3 })
      .where(eq(outboundWebhookEndpoints.id, endpoint.id));
    const delivery = await insertDelivery(endpoint.id);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { status: 200 }))
    );

    await handleDeliverOutboundWebhook([makeJob(delivery.id)]);

    const updated = await getWebhookEndpoint(endpoint.id);
    expect(updated?.consecutiveFailures).toBe(0);

    const deliveryRow = await getDelivery(delivery.id);
    expect(deliveryRow?.status).toBe("delivered");
    expect(deliveryRow?.responseStatus).toBe(200);
  });
});

describe("handleDeliverOutboundWebhook — failure & retry contract", () => {
  it("marks the delivery failed, increments failures, and re-throws for pg-boss retry", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });
    const delivery = await insertDelivery(endpoint.id);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("server error", { status: 500 }))
    );

    await expect(
      handleDeliverOutboundWebhook([makeJob(delivery.id)])
    ).rejects.toThrow();

    const updated = await getWebhookEndpoint(endpoint.id);
    expect(updated?.consecutiveFailures).toBe(1);
  });

  it("re-throws and marks failed on a network-level error too", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });
    const delivery = await insertDelivery(endpoint.id);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );

    await expect(
      handleDeliverOutboundWebhook([makeJob(delivery.id)])
    ).rejects.toThrow();

    const updated = await getWebhookEndpoint(endpoint.id);
    expect(updated?.consecutiveFailures).toBe(1);
  });

  it("auto-disables the endpoint after 50 consecutive failures and audit-logs it", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });
    await db
      .update(outboundWebhookEndpoints)
      .set({ consecutiveFailures: 49 })
      .where(eq(outboundWebhookEndpoints.id, endpoint.id));
    const delivery = await insertDelivery(endpoint.id);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("still down", { status: 503 }))
    );

    await expect(
      handleDeliverOutboundWebhook([makeJob(delivery.id)])
    ).rejects.toThrow();

    const updated = await getWebhookEndpoint(endpoint.id);
    expect(updated?.isEnabled).toBe(false);
    expect(updated?.disabledReason).toBe("consecutive_failures");

    // The audit() call at the disable site is fire-and-forget (not awaited),
    // matching the app's own pattern elsewhere — poll briefly for it to land.
    let logs: { action: string }[] = [];
    for (let i = 0; i < 20 && logs.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 25));
      logs = await db
        .select({ action: auditLogs.action })
        .from(auditLogs)
        .where(eq(auditLogs.entityId, endpoint.id));
    }
    expect(logs.some((l) => l.action === "webhook.disabled")).toBe(true);
  });
});

describe("handleDeliverOutboundWebhook — SSRF protection", () => {
  it("rejects a non-HTTPS endpoint without ever calling fetch", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      url: "http://example.test/webhook",
      events: ["post.created"],
    });
    const delivery = await insertDelivery(endpoint.id);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // SSRF rejection is a permanent failure, not retried — resolves, no throw.
    await expect(
      handleDeliverOutboundWebhook([makeJob(delivery.id)])
    ).resolves.not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();

    const deliveryRow = await getDelivery(delivery.id);
    expect(deliveryRow?.status).toBe("failed");
    expect(deliveryRow?.lastError).toMatch(/https/i);
  });

  it("rejects an endpoint resolving to a private/reserved address", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      url: "https://127.0.0.1/webhook",
      events: ["post.created"],
    });
    const delivery = await insertDelivery(endpoint.id);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await handleDeliverOutboundWebhook([makeJob(delivery.id)]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("handleDeliverOutboundWebhook — ENCRYPTION_KEY unavailable", () => {
  it("fails the delivery gracefully without calling fetch", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: ["post.created"],
    });
    const delivery = await insertDelivery(endpoint.id);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const original = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      await handleDeliverOutboundWebhook([makeJob(delivery.id)]);
    } finally {
      process.env.ENCRYPTION_KEY = original;
    }

    expect(fetchMock).not.toHaveBeenCalled();
    const deliveryRow = await getDelivery(delivery.id);
    expect(deliveryRow?.status).toBe("failed");
    expect(deliveryRow?.lastError).toMatch(/ENCRYPTION_KEY/);
  });
});
