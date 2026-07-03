import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { outboundWebhookDeliveries } from "@/db/schema/webhooks";
import { db } from "@/lib/db";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatch";
import { ALL_WEBHOOK_EVENTS, WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import {
  createTestUser,
  createTestWebhookEndpoint,
  createTestWorkspace,
} from "../setup/fixtures";
import { resetDb } from "../setup/reset-db";

beforeEach(async () => {
  await resetDb();
});

async function deliveriesForEndpoint(endpointId: string) {
  return db
    .select()
    .from(outboundWebhookDeliveries)
    .where(eq(outboundWebhookDeliveries.endpointId, endpointId));
}

describe("dispatchWebhookEvent", () => {
  it("creates a pending delivery for an enabled endpoint subscribed to the event", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: [WEBHOOK_EVENTS.POST_CREATED],
    });

    await dispatchWebhookEvent(ws.id, WEBHOOK_EVENTS.POST_CREATED, {
      id: "post-1",
    });

    const deliveries = await deliveriesForEndpoint(endpoint.id);
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe("pending");
    expect(deliveries[0]?.event).toBe(WEBHOOK_EVENTS.POST_CREATED);
    expect(deliveries[0]?.payload).toEqual({ id: "post-1" });
  });

  it("does not deliver to an endpoint not subscribed to the event", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: [WEBHOOK_EVENTS.COMMENT_CREATED],
    });

    await dispatchWebhookEvent(ws.id, WEBHOOK_EVENTS.POST_CREATED, {});

    expect(await deliveriesForEndpoint(endpoint.id)).toHaveLength(0);
  });

  it("does not deliver to a disabled endpoint", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: [WEBHOOK_EVENTS.POST_CREATED],
      isEnabled: false,
    });

    await dispatchWebhookEvent(ws.id, WEBHOOK_EVENTS.POST_CREATED, {});

    expect(await deliveriesForEndpoint(endpoint.id)).toHaveLength(0);
  });

  it("never delivers to another workspace's endpoint", async () => {
    const ownerA = await createTestUser();
    const wsA = await createTestWorkspace(ownerA.id, ownerA.email);
    const ownerB = await createTestUser();
    const wsB = await createTestWorkspace(ownerB.id, ownerB.email);
    const { endpoint: endpointB } = await createTestWebhookEndpoint({
      workspaceId: wsB.id,
      events: [WEBHOOK_EVENTS.POST_CREATED],
    });

    await dispatchWebhookEvent(wsA.id, WEBHOOK_EVENTS.POST_CREATED, {});

    expect(await deliveriesForEndpoint(endpointB.id)).toHaveLength(0);
  });

  it("delivers to multiple endpoints subscribed to the same event", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint: e1 } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      url: "https://one.example.test/hook",
      events: [WEBHOOK_EVENTS.POST_CREATED],
    });
    const { endpoint: e2 } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      url: "https://two.example.test/hook",
      events: [WEBHOOK_EVENTS.POST_CREATED, WEBHOOK_EVENTS.POST_DELETED],
    });

    await dispatchWebhookEvent(ws.id, WEBHOOK_EVENTS.POST_CREATED, {});

    expect(await deliveriesForEndpoint(e1.id)).toHaveLength(1);
    expect(await deliveriesForEndpoint(e2.id)).toHaveLength(1);
  });

  it("does not throw when no endpoints are subscribed", async () => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    await expect(
      dispatchWebhookEvent(ws.id, WEBHOOK_EVENTS.POST_CREATED, {})
    ).resolves.not.toThrow();
  });

  it.each(
    ALL_WEBHOOK_EVENTS
  )("correctly dispatches the %s event", async (event) => {
    const owner = await createTestUser();
    const ws = await createTestWorkspace(owner.id, owner.email);
    const { endpoint } = await createTestWebhookEndpoint({
      workspaceId: ws.id,
      events: [event],
    });

    await dispatchWebhookEvent(ws.id, event, { marker: event });

    const deliveries = await deliveriesForEndpoint(endpoint.id);
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.event).toBe(event);
  });
});
