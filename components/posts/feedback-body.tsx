import { sanitizeChangelogHtml } from "@/lib/changelog/html";

// Renders a feedback post's description. New posts are written with the Quill
// editor and stored as HTML; older posts are plain text. Detect which and
// render accordingly, so pre-existing plain-text posts keep their line breaks
// while rich-text posts render their formatting (code, lists, quotes, …).
const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);

export function FeedbackBody({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  if (looksLikeHtml(body)) {
    return (
      <div
        className={`comment-body ${className ?? ""}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized HTML from our own Quill editor
        dangerouslySetInnerHTML={{ __html: sanitizeChangelogHtml(body) }}
      />
    );
  }
  return <p className={`whitespace-pre-wrap ${className ?? ""}`}>{body}</p>;
}
