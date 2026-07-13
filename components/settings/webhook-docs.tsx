import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ApiKeyCodeBlock } from "./api-key-code-block";

export function WebhookDocs() {
  return (
    <div className="mt-8 overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
      <div className="border-b border-ir-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ir-heading">
          Webhook documentation
        </h2>
        <p className="mt-0.5 text-xs text-ir-muted">
          How outbound webhooks are sent, signed, and retried.
        </p>
      </div>

      <Accordion className="px-5" collapsible type="single">
        <AccordionItem value="what">
          <AccordionTrigger>What are webhooks?</AccordionTrigger>
          <AccordionContent>
            <p className="text-ir-muted">
              An endpoint you register receives an HTTP POST every time a
              subscribed event happens in this workspace — a post created, a
              status changed, a vote cast, and so on. Use it to sync feedback
              into another tool, notify a Slack channel, or trigger your own
              automation, without polling the API.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="setup">
          <AccordionTrigger>Adding an endpoint</AccordionTrigger>
          <AccordionContent>
            <p className="text-ir-muted">
              Enter an HTTPS URL (HTTP is rejected, and so is anything resolving
              to a private or local address) and choose which events it should
              receive. You'll get a signing secret shown once at creation — it
              can be viewed again later from the endpoint's row, unlike an API
              key.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="verify">
          <AccordionTrigger>Verifying the signature</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-ir-muted">
              Every request carries an{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                X-IdeaRoads-Signature
              </code>{" "}
              header shaped like{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                t=&#123;timestamp&#125;,v1=&#123;hmac&#125;
              </code>
              . Recompute the HMAC yourself and compare — never trust an
              unverified request.
            </p>
            <ApiKeyCodeBlock
              code={`const [, ts, hmac] = signatureHeader.match(/^t=(\\d+),v1=([0-9a-f]+)$/);
const expected = crypto
  .createHmac("sha256", YOUR_SIGNING_SECRET)
  .update(\`\${ts}.\${rawRequestBody}\`)
  .digest("hex");

if (expected !== hmac) {
  // reject — signature doesn't match
}`}
            />
            <p className="text-ir-muted">
              Use the raw, unparsed request body for this — re-serializing
              parsed JSON can produce a different byte sequence and a
              false-negative match.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="payload">
          <AccordionTrigger>Request shape</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-ir-muted">
              The event name arrives as its own header —{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                X-IdeaRoads-Event
              </code>{" "}
              — since the JSON body only carries that event's own data, with no
              wrapping envelope. Example for{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                post.created
              </code>
              :
            </p>
            <ApiKeyCodeBlock
              code={`POST /your-endpoint HTTP/1.1
Content-Type: application/json
X-IdeaRoads-Event: post.created
X-IdeaRoads-Signature: t=1699999999,v1=8f3a...
User-Agent: IdeaRoads-Webhook/1.0

{
  "id": "post_abc123",
  "title": "Dark mode",
  "slug": "dark-mode",
  "boardId": "board_xyz789"
}`}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="delivery">
          <AccordionTrigger>
            Delivery, retries &amp; auto-disable
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1.5 pl-4 text-ir-muted">
              <li>
                A non-2xx response or a network error is retried; each
                endpoint's row shows its current status and any consecutive
                failure count.
              </li>
              <li>
                After 50 consecutive failures, the endpoint is automatically
                disabled and stops receiving events — re-enabling it from the
                table clears the failure count and resumes delivery.
              </li>
              <li>
                Requests time out after 10 seconds and expect a 2xx response;
                anything else counts as a failure.
              </li>
              <li>
                Delivery history is kept for 30 days, then cleared
                automatically.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger>Best practices</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1.5 pl-4 text-ir-muted">
              <li>
                Always verify the signature before acting on a request — without
                it, anyone who finds your URL could send fake events.
              </li>
              <li>
                Store the signing secret like a password (server-side
                environment variable or secret manager, never client-side code).
              </li>
              <li>
                Respond quickly with a 2xx once you've queued the work — slow
                handlers risk hitting the 10-second timeout and being treated as
                a failure.
              </li>
              <li>
                Give each integration its own endpoint so one misbehaving
                consumer doesn't need to affect the others.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
