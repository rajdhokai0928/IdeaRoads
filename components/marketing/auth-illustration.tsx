import {
  CaretUpIcon,
  ChatCircleIcon,
  CheckIcon,
} from "@phosphor-icons/react/dist/ssr";

const ROADMAP_STAGES = [
  { label: "Planned", dotClass: "bg-ir-border" },
  { label: "In Progress", dotClass: "bg-ir-warning" },
  { label: "Shipped", dotClass: "bg-ir-success" },
] as const;

// Decorative brand panel for the auth screen — an abstract composition of
// the product's own vocabulary (roadmap stages, an upvoted feedback card, a
// comment count) rather than a literal product screenshot, so it reads as
// an illustration. aria-hidden: purely decorative, the heading text next to
// it already carries the meaning.
export function AuthIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-xs px-6 py-10"
    >
      <div
        className="absolute top-2 left-2 size-36 rounded-ir-full bg-ir-primary-light/20"
        style={{ filter: "blur(2px)" }}
      />
      <div className="absolute right-0 bottom-4 size-28 rounded-ir-full bg-ir-primary-light/25" />

      <div className="relative rounded-ir-lg border border-ir-border bg-ir-surface p-5 shadow-ir-lg">
        <p className="text-2xs font-semibold tracking-ui text-ir-muted uppercase">
          Roadmap
        </p>
        <div className="mt-4 space-y-4">
          {ROADMAP_STAGES.map((stage, i) => (
            <div className="flex items-center gap-3" key={stage.label}>
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-ir-full ${stage.dotClass}`}
              >
                {i === ROADMAP_STAGES.length - 1 && (
                  <CheckIcon className="size-3 text-white" weight="bold" />
                )}
              </span>
              <span className="text-sm font-medium text-ir-heading">
                {stage.label}
              </span>
              {i < ROADMAP_STAGES.length - 1 && (
                <span className="h-px flex-1 bg-ir-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-5 -right-6 w-40 rotate-3 rounded-ir-md border border-ir-border bg-ir-surface p-3 shadow-ir-md">
        <div className="flex items-start gap-2">
          <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-ir-sm border border-ir-primary/30 bg-ir-primary-light/15 px-2 py-1">
            <CaretUpIcon className="size-3 text-ir-primary" weight="bold" />
            <span className="text-xs font-semibold text-ir-primary">128</span>
          </div>
          <p className="text-xs leading-snug font-medium text-ir-heading">
            Dark mode support
          </p>
        </div>
      </div>

      <div className="absolute -bottom-3 -left-6 flex items-center gap-1.5 rounded-ir-full border border-ir-border bg-ir-surface px-3 py-1.5 shadow-ir-md">
        <ChatCircleIcon className="size-3.5 text-ir-primary" />
        <span className="text-xs font-medium text-ir-heading">12 comments</span>
      </div>
    </div>
  );
}
