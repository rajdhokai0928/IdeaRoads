"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

const MotionDiv = motion.create("div")

// motion.create()'s props conflict with the native HTML drag-event handlers
// (onDrag/onDragStart/etc. have incompatible signatures) — Card never
// exposes native drag, so those keys are dropped from the prop surface.
type NativeDivProps = Omit<
  React.ComponentProps<"div">,
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

function Card({
  className,
  size = "default",
  ...props
}: NativeDivProps & { size?: "default" | "sm" }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <MotionDiv
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface py-(--card-spacing) text-sm text-ir-body shadow-ir-xs transition-shadow duration-150 ease-ir-standard hover:shadow-ir-sm [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-ir-card *:[img:last-child]:rounded-b-ir-card",
        className
      )}
      transition={{ duration: 0.15, ease: "easeOut" }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-none px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-ui text-ir-heading uppercase",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-ir-muted", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
