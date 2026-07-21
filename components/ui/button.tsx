"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "framer-motion"
import { Slot } from "radix-ui"

import { buttonVariants } from "@/components/ui/button-variants"
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
