"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEmbedConfigAction } from "@/app/actions/embed";
import type { EmbedMode, EmbedPosition, EmbedTheme } from "@/lib/embed/queries";

interface Props {
  appUrl: string;
  initialConfig: {
    accentColor: string;
    height: number;
    mode: EmbedMode;
    position: EmbedPosition;
    theme: EmbedTheme;
    width: number;
  };
  workspaceId: string;
  workspaceSlug: string;
}

const MODE_OPTIONS: { label: string; value: EmbedMode }[] = [
  { label: "Inline", value: "inline" },
  { label: "Floating launcher", value: "button" },
];

const POSITION_OPTIONS: { label: string; value: EmbedPosition }[] = [
  { label: "Bottom right", value: "bottom-right" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Top right", value: "top-right" },
  { label: "Top left", value: "top-left" },
];

const THEME_OPTIONS: { label: string; value: EmbedTheme }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "Auto (match visitor's system)", value: "auto" },
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function buildSnippet(input: {
  accentColor: string;
  appUrl: string;
  height: number;
  mode: EmbedMode;
  position: EmbedPosition;
  theme: EmbedTheme;
  width: number;
  workspaceSlug: string;
}): string {
  const attrs = [
    `data-workspace="${input.workspaceSlug}"`,
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      className="shrink-0 px-2.5 py-1 text-xs border border-border hover:bg-muted transition-colors duration-150 focus-visible:outline-none"
      onClick={copy}
      type="button"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function EmbedSection({
  workspaceId,
  workspaceSlug,
  appUrl,
  initialConfig,
}: Props) {
  const [mode, setMode] = useState(initialConfig.mode);
  const [position, setPosition] = useState(initialConfig.position);
  const [theme, setTheme] = useState(initialConfig.theme);
  const [width, setWidth] = useState(String(initialConfig.width));
  const [height, setHeight] = useState(String(initialConfig.height));
  const [accentColor, setAccentColor] = useState(initialConfig.accentColor);
  const [accentColorError, setAccentColorError] = useState("");
  const [isPending, startTransition] = useTransition();

  const widthNum = Number(width) || initialConfig.width;
  const heightNum = Number(height) || initialConfig.height;

  const snippet = buildSnippet({
    accentColor,
    appUrl,
    height: heightNum,
    mode,
    position,
    theme,
    width: widthNum,
    workspaceSlug,
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setAccentColorError("");

    if (!HEX_COLOR.test(accentColor)) {
      setAccentColorError("Must be a hex color like #2563eb.");
      return;
    }

    startTransition(async () => {
      const result = await updateEmbedConfigAction({
        workspaceId,
        mode,
        position,
        theme,
        width: widthNum,
        height: heightNum,
        accentColor,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Embed settings saved");
    });
  }

  return (
    <div className="space-y-8">
      <form className="space-y-5" onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="embed-mode"
            >
              Launcher
            </label>
            <select
              className="w-full h-8 border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
              id="embed-mode"
              onChange={(e) => setMode(e.target.value as EmbedMode)}
              value={mode}
            >
              {MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Inline embeds in the page; the floating launcher adds a button
              that opens a panel.
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="embed-position"
            >
              Position
            </label>
            <select
              className="w-full h-8 border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending || mode !== "button"}
              id="embed-position"
              onChange={(e) => setPosition(e.target.value as EmbedPosition)}
              value={position}
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Only applies to the floating launcher.
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="embed-theme"
            >
              Theme
            </label>
            <select
              className="w-full h-8 border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
              id="embed-theme"
              onChange={(e) => setTheme(e.target.value as EmbedTheme)}
              value={theme}
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="embed-accent"
            >
              Accent color
            </label>
            <div className="flex items-center gap-2">
              <input
                aria-label="Pick accent color"
                className="h-8 w-8 shrink-0 border border-border p-0.5 bg-background"
                disabled={isPending}
                onChange={(e) => setAccentColor(e.target.value)}
                type="color"
                value={HEX_COLOR.test(accentColor) ? accentColor : "#111111"}
              />
              <input
                className="w-full h-8 border border-border bg-background px-2.5 text-sm font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isPending}
                id="embed-accent"
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#2563eb"
                value={accentColor}
              />
            </div>
            {accentColorError && (
              <p className="mt-1 text-xs text-destructive">
                {accentColorError}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="embed-width"
            >
              Width (px)
            </label>
            <input
              className="w-full h-8 border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
              id="embed-width"
              max={1200}
              min={240}
              onChange={(e) => setWidth(e.target.value)}
              type="number"
              value={width}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="embed-height"
            >
              Height (px)
            </label>
            <input
              className="w-full h-8 border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
              id="embed-height"
              max={1200}
              min={240}
              onChange={(e) => setHeight(e.target.value)}
              type="number"
              value={height}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Initial size for inline embeds — they auto-resize to fit content
              after loading.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="px-3.5 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-sm font-semibold text-foreground">Embed snippet</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Paste this where you want the widget to appear on your site. It
          updates live as you change the settings above.
        </p>
        <div className="mt-3 flex items-start gap-2 p-3 bg-muted border border-border">
          <pre className="flex-1 min-w-0 overflow-x-auto whitespace-pre font-mono text-xs text-foreground">
            {snippet}
          </pre>
          <CopyButton value={snippet} />
        </div>
      </section>
    </div>
  );
}
