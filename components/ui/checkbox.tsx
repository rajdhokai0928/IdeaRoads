"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "@phosphor-icons/react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4.5 shrink-0 items-center justify-center rounded-ir-xs border border-ir-border bg-ir-surface transition-colors duration-150 ease-ir-standard outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-ir-primary/50 focus-visible:border-ir-primary focus-visible:ring-2 focus-visible:ring-ir-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-ir-border aria-invalid:border-ir-danger aria-invalid:ring-2 aria-invalid:ring-ir-danger/20 aria-invalid:aria-checked:border-ir-primary dark:aria-invalid:border-ir-danger/50 dark:aria-invalid:ring-ir-danger/40 data-checked:border-ir-primary data-checked:bg-ir-primary data-checked:text-ir-primary-foreground dark:data-checked:bg-ir-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
