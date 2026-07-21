import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeBlock } from "./code-block";

interface EmbedDocsProps {
  appUrl: string;
}

export function EmbedDocs({ appUrl }: EmbedDocsProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
      <div className="border-b border-ir-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ir-heading">
          Embed documentation
        </h2>
        <p className="mt-0.5 text-xs text-ir-muted">
          How the widget script works and how to integrate it on your site.
        </p>
      </div>

      <Accordion className="px-5" collapsible type="single">
        <AccordionItem value="what">
          <AccordionTrigger>What is the embed widget?</AccordionTrigger>
          <AccordionContent>
            <p className="text-ir-muted">
              A single script tag that shows your public feedback board on your
              own site — either inline in the page, or as a floating launcher
              button that opens a panel. It's a plain iframe pointed at the same
              public board page visitors already see at{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                {appUrl}/{"{workspace}"}/b/{"{board}"}
              </code>
              , so it's public and anonymous by design — visitors don't sign in
              with anything related to your account.
            </p>
            <p className="text-ir-muted">
              Visitors get a full experience without leaving your site — a
              Feedback / Roadmap / Changelog tab bar (whichever of those you've
              made public), browsing, submitting feedback, voting, and
              commenting all happen in place, with sign-in itself handled by an
              in-panel email code so nothing ever navigates away from the
              widget.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="placement">
          <AccordionTrigger>Where to place the script</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-ir-muted">
              <strong className="text-ir-heading">Floating launcher</strong> —
              place it just before{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                {"</body>"}
              </code>
              . It attaches a fixed-position button to{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                document.body
              </code>
              , so its position on the page doesn't matter — it waits for the
              page to be ready before mounting.
            </p>
            <p className="text-ir-muted">
              <strong className="text-ir-heading">Inline</strong> — place the
              script tag exactly where you want the widget to appear; it inserts
              the widget as the very next element after itself. To mount it
              somewhere else instead, add{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                data-container="some-id"
              </code>{" "}
              and give a{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                {'<div id="some-id">'}
              </code>{" "}
              on the page — then the script itself can go anywhere, including
              just before{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                {"</body>"}
              </code>
              .
            </p>
            <p className="text-ir-muted">
              It should not go inside{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                {"<head>"}
              </code>{" "}
              for inline mode — there's no element after it there for the widget
              to render into.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="snippet">
          <AccordionTrigger>Integration example</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-ir-muted">
              The snippet above (generated from your current settings) is the
              one to copy — it always includes the board you've selected. A
              typical inline embed looks like this:
            </p>
            <CodeBlock
              code={`<script src="${appUrl}/widget.js"
        data-workspace="acme"
        data-board="feature-requests"
        data-mode="inline"
        data-theme="light"
        data-width="380"
        data-height="560"
        data-accent-color="#111111"></script>`}
            />
            <p className="text-ir-muted">
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                data-workspace
              </code>{" "}
              and{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                data-board
              </code>{" "}
              are both required — there's no page at the bare workspace root, so
              a snippet missing{" "}
              <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                data-board
              </code>{" "}
              loads a 404 inside the iframe. The snippet generated above always
              includes both.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="how">
          <AccordionTrigger>How it works</AccordionTrigger>
          <AccordionContent className="space-y-2">
            <ul className="list-disc space-y-1.5 pl-4 text-ir-muted">
              <li>
                The script reads its own{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  data-*
                </code>{" "}
                attributes and builds an iframe pointed at{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  /{"{workspace}"}/b/{"{board}"}?embed=1
                </code>{" "}
                on this app — the same public page your board already has, in a
                stripped-down layout (no site header, no "Powered by" badge).
              </li>
              <li>
                For inline mode, the embedded page reports its content height to
                the parent window via{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  postMessage
                </code>{" "}
                whenever it changes, so the iframe auto-resizes and never shows
                an internal scrollbar. The floating launcher's panel stays a
                fixed size instead (the one you configure above).
              </li>
              <li>
                Theme and accent color are passed through the iframe's URL query
                string and applied inside the embedded page.{" "}
                <strong className="text-ir-heading">Auto theme</strong> is a
                placeholder for now — it renders light, since there's no visitor
                OS-preference detection wired up yet.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="troubleshooting">
          <AccordionTrigger>
            Common errors &amp; troubleshooting
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1.5 pl-4 text-ir-muted">
              <li>
                <strong className="text-ir-heading">
                  Nothing renders, console shows "data-workspace attribute is
                  required"
                </strong>{" "}
                — the script tag is missing{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  data-workspace
                </code>
                . Re-copy the snippet above.
              </li>
              <li>
                <strong className="text-ir-heading">
                  The iframe shows a 404 page
                </strong>{" "}
                — the board slug in{" "}
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  data-board
                </code>{" "}
                doesn't exist (or was renamed/archived) in this workspace, or
                the attribute was removed by hand.
              </li>
              <li>
                <strong className="text-ir-heading">
                  I changed settings above but the live site looks the same
                </strong>{" "}
                — saving here doesn't reach snippets already pasted elsewhere.
                Copy the updated snippet and replace it on your site.
              </li>
              <li>
                <strong className="text-ir-heading">
                  Accent color isn't applying
                </strong>{" "}
                — it's validated as a 6-digit hex code (
                <code className="text-xs rounded-ir-xs bg-ir-muted-surface px-1 py-0.5">
                  #2563eb
                </code>
                ); anything else is silently ignored and falls back to the
                default.
              </li>
              <li>
                <strong className="text-ir-heading">
                  A visitor is asked to sign in before submitting, voting, or
                  commenting
                </strong>{" "}
                — that's expected; those actions still require a visitor
                account, same as the public portal. Inside the widget it's a
                one-time email code entered without leaving the panel, and
                whatever they were doing (a draft, a vote, a comment) resumes
                automatically once they're signed in.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger>Best practices</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-1.5 pl-4 text-ir-muted">
              <li>
                Only public boards can be embedded — the widget is anonymous, so
                private-board content is never exposed through it.
              </li>
              <li>
                Re-copy and re-paste the snippet after changing settings here —
                old snippets keep their old appearance until replaced.
              </li>
              <li>
                Use the floating launcher for marketing/product pages where
                feedback is secondary, and inline for a dedicated feedback page
                or in-app panel.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
