import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ApiKeyCodeBlock } from "./api-key-code-block";

interface ApiKeyDocsProps {
  appUrl: string;
}

export function ApiKeyDocs({ appUrl }: ApiKeyDocsProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
      <div className="border-b border-ir-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ir-heading">
          API documentation
        </h2>
        <p className="mt-0.5 text-xs text-ir-muted">
          Everything you need to call the public API with a workspace key.
        </p>
      </div>

      <Accordion className="px-5" collapsible type="single">
        <AccordionItem value="what">
          <AccordionTrigger>What is an API key?</AccordionTrigger>
          <AccordionContent>
            <p className="text-ir-muted">
              An API key is a workspace-scoped credential that lets external
              systems read your feedback, roadmap, and changelog data
              programmatically — for example, to sync feedback into a support
              tool or display your roadmap on a custom site. Every request made
              with a key is scoped strictly to the workspace that created it; a
              key can never read or write another workspace's data.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="auth">
          <AccordionTrigger>Authentication</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-ir-muted">
              Send your key as a bearer token, or in an{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                x-api-key
              </code>{" "}
              header — both are accepted:
            </p>
            <ApiKeyCodeBlock
              code={`curl "${appUrl}/api/v1/posts" \\
  -H "Authorization: Bearer ir_live_..."`}
            />
            <ApiKeyCodeBlock
              code={`curl "${appUrl}/api/v1/posts" \\
  -H "x-api-key: ir_live_..."`}
            />
            <p className="text-ir-muted">
              Requests without a valid key return{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                401
              </code>
              .
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="endpoints">
          <AccordionTrigger>Endpoints</AccordionTrigger>
          <AccordionContent className="space-y-5">
            <div>
              <p className="font-medium text-ir-heading">
                <code className="text-xs">GET /api/v1/posts</code>
              </p>
              <p className="mt-1 text-ir-muted">
                List approved feedback in your workspace. Supports{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  ?limit=1-100
                </code>{" "}
                (default 50) and{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  ?boardSlug=
                </code>
                . Posts on private boards are never returned.
              </p>
              <div className="mt-2">
                <ApiKeyCodeBlock
                  code={`curl "${appUrl}/api/v1/posts?limit=20" \\
  -H "Authorization: Bearer ir_live_..."`}
                />
              </div>
            </div>

            <div>
              <p className="font-medium text-ir-heading">
                <code className="text-xs">GET /api/v1/posts/:postId</code>
              </p>
              <p className="mt-1 text-ir-muted">
                Fetch a single approved post by ID.
              </p>
              <div className="mt-2">
                <ApiKeyCodeBlock
                  code={`curl "${appUrl}/api/v1/posts/POST_ID" \\
  -H "Authorization: Bearer ir_live_..."`}
                />
              </div>
            </div>

            <div>
              <p className="font-medium text-ir-heading">
                <code className="text-xs">GET /api/v1/roadmap</code>
              </p>
              <p className="mt-1 text-ir-muted">
                Roadmap posts grouped by status (
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  planned
                </code>
                ,{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  in_progress
                </code>
                ,{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  completed
                </code>
                ). Excludes private and archived boards.
              </p>
              <div className="mt-2">
                <ApiKeyCodeBlock
                  code={`curl "${appUrl}/api/v1/roadmap" \\
  -H "Authorization: Bearer ir_live_..."`}
                />
              </div>
            </div>

            <div>
              <p className="font-medium text-ir-heading">
                <code className="text-xs">GET /api/v1/changelog</code>
              </p>
              <p className="mt-1 text-ir-muted">
                List published changelog entries. Supports{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  ?limit=1-100
                </code>{" "}
                (default 50).
              </p>
              <div className="mt-2">
                <ApiKeyCodeBlock
                  code={`curl "${appUrl}/api/v1/changelog" \\
  -H "Authorization: Bearer ir_live_..."`}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="manage">
          <AccordionTrigger>Copying &amp; revoking a key</AccordionTrigger>
          <AccordionContent>
            <p className="text-ir-muted">
              A key's full value is shown only once, right after you create it —
              copy it somewhere safe immediately, since it can't be viewed again
              afterward. There's no way to reveal a lost key or "regenerate" it
              in place; instead, create a new key and revoke the old one once
              everything using it has switched over. Revoking a key takes effect
              immediately and can't be undone.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger>Security recommendations</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1.5 pl-4 text-ir-muted">
              <li>
                Treat a key like a password — never commit it to source control
                or expose it in client-side code.
              </li>
              <li>
                Store keys in your server's environment variables or a secret
                manager.
              </li>
              <li>
                Give each integration its own key (name them for what they're
                used for) so you can revoke one without affecting others.
              </li>
              <li>
                Revoke a key immediately if it may have leaked, then issue a
                replacement.
              </li>
              <li>
                Keys only grant read access to approved, public-board content —
                they can't create, edit, or delete anything.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
