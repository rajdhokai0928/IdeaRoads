import type { CSSProperties } from "react";

export interface ParsedEmbedParams {
  accentColor?: string;
  isEmbed: boolean;
  theme?: "light" | "dark";
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Reads the embed-related query params widget.js appends to the iframe src.
// "auto" theme (and anything unrecognized) intentionally resolves to no
// override — the app has no OS-preference-based dark mode wired up today, so
// "auto" falls back to the default (light) rendering rather than pretending
// to support a theme mode that isn't actually implemented.
export function parseEmbedParams(searchParams: {
  accentColor?: string;
  embed?: string;
  theme?: string;
}): ParsedEmbedParams {
  const isEmbed = searchParams.embed === "1";
  const theme =
    searchParams.theme === "dark" || searchParams.theme === "light"
      ? searchParams.theme
      : undefined;
  const accentColor =
    searchParams.accentColor && HEX_COLOR.test(searchParams.accentColor)
      ? searchParams.accentColor
      : undefined;
  return { accentColor, isEmbed, theme };
}

// Builds the query string used on internal links so embed mode (and the
// admin's chosen theme/accent) survives navigation between embedded pages.
export function buildEmbedQuery(params: ParsedEmbedParams): string {
  if (!params.isEmbed) {
    return "";
  }
  const qs = new URLSearchParams({ embed: "1" });
  if (params.theme) {
    qs.set("theme", params.theme);
  }
  if (params.accentColor) {
    qs.set("accentColor", params.accentColor);
  }
  return `?${qs.toString()}`;
}

// className + inline style to spread onto an embedded page's root wrapper —
// applies the `.dark` class for a forced dark theme, and overrides the
// --primary/--primary-foreground tokens so primary actions (vote button, "New
// post", etc.) pick up the workspace's configured accent color.
export function embedWrapperProps(params: ParsedEmbedParams): {
  className: string;
  style: CSSProperties;
} {
  const style: Record<string, string> = {};
  if (params.accentColor) {
    style["--primary"] = params.accentColor;
    style["--primary-foreground"] = contrastForeground(params.accentColor);
  }
  return {
    className: params.theme === "dark" ? "dark" : "",
    style: style as CSSProperties,
  };
}

function contrastForeground(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#ffffff";
}
