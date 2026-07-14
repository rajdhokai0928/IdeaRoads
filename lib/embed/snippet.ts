import type { EmbedMode, EmbedPosition, EmbedTheme } from "@/lib/embed/queries";

export interface EmbedSnippetInput {
  accentColor: string;
  appUrl: string;
  boardSlug: string;
  height: number;
  mode: EmbedMode;
  position: EmbedPosition;
  theme: EmbedTheme;
  width: number;
  workspaceSlug: string;
}

/**
 * Builds the `<script>` snippet customers paste onto their site. Throws
 * rather than silently emitting a broken tag — `data-workspace` and
 * `data-board` are both load-bearing: the public portal has no page at the
 * bare workspace root, so a snippet missing either one 404s (or, worse,
 * cross-host-redirects an embedded visitor into the admin app's sign-in).
 * Callers must gate on a selected board before calling this.
 */
export function buildEmbedSnippet(input: EmbedSnippetInput): string {
  if (!input.workspaceSlug) {
    throw new Error("buildEmbedSnippet: workspaceSlug is required");
  }
  if (!input.boardSlug) {
    throw new Error(
      "buildEmbedSnippet: boardSlug is required — every embed snippet must include data-board"
    );
  }

  const attrs = [
    `data-workspace="${input.workspaceSlug}"`,
    `data-board="${input.boardSlug}"`,
    `data-mode="${input.mode}"`,
  ];
  if (input.mode === "button") {
    attrs.push(`data-position="${input.position}"`);
  }
  attrs.push(
    `data-theme="${input.theme}"`,
    `data-width="${input.width}"`,
    `data-height="${input.height}"`,
    `data-accent-color="${input.accentColor}"`
  );

  return `<script src="${input.appUrl}/widget.js"\n        ${attrs.join("\n        ")}></script>`;
}
