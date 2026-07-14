import { describe, expect, it } from "vitest";
import { buildEmbedSnippet } from "@/lib/embed/snippet";

const BASE_INPUT = {
  accentColor: "#2563eb",
  appUrl: "https://portal.example.com",
  boardSlug: "feature-requests",
  height: 700,
  mode: "button" as const,
  position: "bottom-right" as const,
  theme: "light" as const,
  width: 500,
  workspaceSlug: "acme",
};

describe("buildEmbedSnippet", () => {
  it("always includes both data-workspace and data-board", () => {
    const snippet = buildEmbedSnippet(BASE_INPUT);
    expect(snippet).toContain('data-workspace="acme"');
    expect(snippet).toContain('data-board="feature-requests"');
  });

  it("includes data-position only in button mode", () => {
    expect(buildEmbedSnippet(BASE_INPUT)).toContain(
      'data-position="bottom-right"'
    );
    expect(buildEmbedSnippet({ ...BASE_INPUT, mode: "inline" })).not.toContain(
      "data-position"
    );
  });

  it("points the script src at the given appUrl", () => {
    expect(buildEmbedSnippet(BASE_INPUT)).toContain(
      'src="https://portal.example.com/widget.js"'
    );
  });

  it("throws rather than emitting a snippet with no board", () => {
    expect(() => buildEmbedSnippet({ ...BASE_INPUT, boardSlug: "" })).toThrow(
      /boardSlug is required/
    );
  });

  it("throws rather than emitting a snippet with no workspace", () => {
    expect(() =>
      buildEmbedSnippet({ ...BASE_INPUT, workspaceSlug: "" })
    ).toThrow(/workspaceSlug is required/);
  });
});
