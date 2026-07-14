"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEmbedConfigAction } from "@/app/actions/embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmbedMode, EmbedPosition, EmbedTheme } from "@/lib/embed/queries";
import { buildEmbedSnippet } from "@/lib/embed/snippet";

interface BoardOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  appUrl: string;
  boards: BoardOption[];
  initialConfig: {
    accentColor: string;
    boardId: string;
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

function CopyButton({
  disabled,
  value,
}: {
  disabled?: boolean;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (disabled) {
      return;
    }
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button
      disabled={disabled}
      onClick={copy}
      size="xs"
      type="button"
      variant="outline"
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

export function EmbedSection({
  workspaceId,
  workspaceSlug,
  appUrl,
  boards,
  initialConfig,
}: Props) {
  const [boardId, setBoardId] = useState(initialConfig.boardId);
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
  const selectedBoard = boards.find((b) => b.id === boardId);
  const isValidConfig = !!selectedBoard;

  const snippet = selectedBoard
    ? buildEmbedSnippet({
        accentColor,
        appUrl,
        boardSlug: selectedBoard.slug,
        height: heightNum,
        mode,
        position,
        theme,
        width: widthNum,
        workspaceSlug,
      })
    : "";

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setAccentColorError("");

    if (!selectedBoard) {
      toast.error("Select a board before saving.");
      return;
    }
    if (!HEX_COLOR.test(accentColor)) {
      setAccentColorError("Must be a hex color like #2563eb.");
      return;
    }

    startTransition(async () => {
      const result = await updateEmbedConfigAction({
        workspaceId,
        boardId: selectedBoard.id,
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

  if (boards.length === 0) {
    return (
      <div className="rounded-ir-sm border border-dashed border-ir-border p-6 text-center">
        <p className="text-sm font-medium text-ir-heading">
          No public boards yet
        </p>
        <p className="mt-1 text-xs text-ir-muted">
          The embed widget shows a public board's feedback — create one and mark
          it public before generating a snippet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form className="space-y-5" onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-board"
            >
              Board
            </label>
            <Select
              disabled={isPending || boards.length < 2}
              onValueChange={setBoardId}
              value={boardId}
            >
              <SelectTrigger className="w-full" id="embed-board">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-ir-muted">
              Which public board the widget shows.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-mode"
            >
              Launcher
            </label>
            <Select
              disabled={isPending}
              onValueChange={(v) => setMode(v as EmbedMode)}
              value={mode}
            >
              <SelectTrigger className="w-full" id="embed-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-ir-muted">
              Inline embeds in the page; the floating launcher adds a button
              that opens a panel.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-position"
            >
              Position
            </label>
            <Select
              disabled={isPending || mode !== "button"}
              onValueChange={(v) => setPosition(v as EmbedPosition)}
              value={position}
            >
              <SelectTrigger className="w-full" id="embed-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-ir-muted">
              Only applies to the floating launcher.
            </p>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-theme"
            >
              Theme
            </label>
            <Select
              disabled={isPending}
              onValueChange={(v) => setTheme(v as EmbedTheme)}
              value={theme}
            >
              <SelectTrigger className="w-full" id="embed-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-accent"
            >
              Accent color
            </label>
            <div className="flex items-center gap-2">
              <input
                aria-label="Pick accent color"
                className="h-10 w-10 shrink-0 rounded-ir-input border border-ir-border bg-ir-surface p-0.5"
                disabled={isPending}
                onChange={(e) => setAccentColor(e.target.value)}
                type="color"
                value={HEX_COLOR.test(accentColor) ? accentColor : "#111111"}
              />
              <Input
                className="font-mono"
                disabled={isPending}
                id="embed-accent"
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#2563eb"
                value={accentColor}
              />
            </div>
            {accentColorError && (
              <p className="mt-1 text-xs text-ir-danger">{accentColorError}</p>
            )}
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-width"
            >
              Width (px)
            </label>
            <Input
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
              className="mb-1 block text-xs font-medium text-ir-heading"
              htmlFor="embed-height"
            >
              Height (px)
            </label>
            <Input
              disabled={isPending}
              id="embed-height"
              max={1200}
              min={240}
              onChange={(e) => setHeight(e.target.value)}
              type="number"
              value={height}
            />
            <p className="mt-1 text-xs text-ir-muted">
              Initial size for inline embeds — they auto-resize to fit content
              after loading.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button disabled={isPending || !isValidConfig} type="submit">
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <section>
        <h2 className="text-sm font-semibold text-ir-heading">Embed snippet</h2>
        <p className="mt-0.5 text-xs text-ir-muted">
          {isValidConfig
            ? "Paste this where you want the widget to appear on your site. It updates live as you change the settings above."
            : "Select a board above to generate a valid embed snippet."}
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-ir-sm border border-ir-border bg-ir-muted-surface p-3">
          <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-pre text-ir-heading">
            {isValidConfig
              ? snippet
              : "// select a board to generate this snippet"}
          </pre>
          <CopyButton disabled={!isValidConfig} value={snippet} />
        </div>
      </section>
    </div>
  );
}
