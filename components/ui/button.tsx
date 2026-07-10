"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "framer-motion"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const MotionButton = motion.create("button")
const MotionSlot = motion.create(Slot.Root)

// motion.create()'s props conflict with the native HTML drag-event handlers
// (onDrag/onDragStart/etc. have incompatible signatures) — Button never
// exposes native drag, so those keys are dropped from the prop surface.
type NativeButtonProps = Omit<
  React.ComponentProps<"button">,
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-ir-button border border-transparent bg-clip-padding text-xs font-semibold tracking-ui whitespace-nowrap uppercase transition-all duration-150 ease-ir-standard outline-none select-none focus-visible:border-ir-primary focus-visible:ring-2 focus-visible:ring-ir-primary/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-ir-danger aria-invalid:ring-2 aria-invalid:ring-ir-danger/20 dark:aria-invalid:border-ir-danger/50 dark:aria-invalid:ring-ir-danger/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-ir-primary text-ir-primary-foreground shadow-ir-xs hover:bg-ir-primary-hover hover:shadow-ir-sm",
        outline:
          "border-ir-border bg-ir-surface hover:bg-ir-muted-surface hover:text-ir-heading aria-expanded:bg-ir-muted-surface aria-expanded:text-ir-heading dark:hover:bg-input/30",
        secondary:
          "bg-ir-muted-surface text-ir-body hover:bg-[color-mix(in_oklch,var(--ir-muted-surface),var(--ir-text-heading)_5%)] aria-expanded:bg-ir-muted-surface aria-expanded:text-ir-heading",
        ghost:
          "hover:bg-ir-muted-surface hover:text-ir-heading aria-expanded:bg-ir-muted-surface aria-expanded:text-ir-heading dark:hover:bg-muted/50",
        destructive:
          "bg-ir-danger/10 text-ir-danger hover:bg-ir-danger/20 focus-visible:border-ir-danger/40 focus-visible:ring-ir-danger/20 dark:bg-ir-danger/20 dark:hover:bg-ir-danger/30 dark:focus-visible:ring-ir-danger/40",
        link: "text-ir-primary underline underline-offset-4 hover:text-ir-primary-hover hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 gap-1.5 px-8 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled,
  ...props
}: NativeButtonProps &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const shouldReduceMotion = useReducedMotion()
  const Comp = asChild ? MotionSlot : MotionButton
  // Popover/dropdown/select triggers already animate their own open state —
  // a hover/tap scale on top of that reads as busy, so they opt out.
  const isPopupTrigger = props["aria-haspopup"] != null
  const canAnimate = !shouldReduceMotion && !disabled && !isPopupTrigger

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      transition={{ duration: 0.1, ease: "easeOut" }}
      whileHover={canAnimate ? { scale: 1.015 } : undefined}
      whileTap={canAnimate ? { scale: 0.97 } : undefined}
      {...props}
    />
  )
}

export { Button, buttonVariants }
