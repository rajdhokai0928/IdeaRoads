import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-ir-full border border-transparent px-2 py-0.5 text-xs font-semibold tracking-ui whitespace-nowrap uppercase transition-colors duration-150 ease-ir-standard focus-visible:border-ir-primary focus-visible:ring-[3px] focus-visible:ring-ir-primary/30 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0 aria-invalid:border-ir-danger aria-invalid:ring-ir-danger/20 dark:aria-invalid:ring-ir-danger/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-ir-primary-light/25 text-ir-primary [a]:hover:bg-ir-primary-light/40",
        secondary:
          "bg-ir-muted-surface text-ir-body [a]:hover:bg-ir-border/60",
        destructive:
          "bg-ir-danger/10 text-ir-danger focus-visible:ring-ir-danger/20 dark:focus-visible:ring-ir-danger/40 [a]:hover:bg-ir-danger/20",
        outline:
          "border-ir-border bg-transparent text-ir-body [a]:hover:bg-ir-muted-surface",
        ghost:
          "border-transparent bg-transparent px-0 text-ir-muted hover:text-ir-heading",
        link: "border-transparent bg-transparent px-0 text-ir-body underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
