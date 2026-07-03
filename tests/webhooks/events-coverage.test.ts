import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_WEBHOOK_EVENTS,
  WEBHOOK_EVENTS,
  type WebhookEvent,
} from "@/lib/webhooks/events";

// This suite verifies the *coverage* of Phase 2 (every business action that
// should dispatch a webhook event still does). It's a static source check
// rather than an end-to-end invocation of the actions themselves, because
// those actions call requireSession() (next/headers), which only resolves
// inside a real Next.js request context — not something a plain integration
// test can construct. dispatch.test.ts already proves the dispatch mechanism
// itself works correctly for every one of these events; this test proves each
// event's real trigger call site hasn't been silently removed.
// Typed as Record<WebhookEvent, ...> (not Record<string, ...>) so TypeScript
// itself enforces that every defined event has an entry here.
const EXPECTED_DISPATCH_SITES: Record<WebhookEvent, string[]> = {
  "post.created": ["app/actions/posts.ts"],
  "post.status_changed": ["app/actions/posts.ts"],
  "post.merged": ["app/actions/posts.ts"],
  "post.deleted": ["app/actions/posts.ts"],
  "comment.created": ["lib/comments/create.ts"],
  "vote.cast": ["app/api/posts/[postId]/vote/route.ts"],
  "member.joined": ["app/actions/members.ts"],
  "member.removed": ["app/actions/members.ts"],
  "changelog.published": ["lib/changelog/publish.ts"],
};

// Reverse map, e.g. "post.created" -> "POST_CREATED", so we can check the
// source references the constant (WEBHOOK_EVENTS.POST_CREATED). Keyed as
// plain strings: Object.entries() always widens keys to string, so matching
// that here avoids a mismatch against the narrower WebhookEvent type.
const constantNameByEvent = new Map<string, string>(
  Object.entries(WEBHOOK_EVENTS).map(([name, value]) => [value, name])
);

function readSource(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("webhook event coverage", () => {
  it("has a trigger-site expectation for every defined event", () => {
    for (const event of ALL_WEBHOOK_EVENTS) {
      expect(
        EXPECTED_DISPATCH_SITES,
        `no expectation registered for "${event}"`
      ).toHaveProperty(event);
    }
  });

  it.each(
    Object.entries(EXPECTED_DISPATCH_SITES)
  )("%s is dispatched from its expected file(s)", (event, files) => {
    const constantName = constantNameByEvent.get(event);

    for (const file of files) {
      const source = readSource(file);
      const referencesEvent =
        (constantName && source.includes(`WEBHOOK_EVENTS.${constantName}`)) ||
        source.includes(`"${event}"`);

      expect(referencesEvent, `expected ${file} to reference "${event}"`).toBe(
        true
      );
      expect(
        source.includes("dispatchWebhookEvent"),
        `expected ${file} to call dispatchWebhookEvent`
      ).toBe(true);
    }
  });
});
