import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge Component
 * Status badges with premium semi-transparent styling
 */

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-white",
        secondary:
          "border-transparent bg-muted text-muted-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "text-foreground border-border",
        // Status variants with semi-transparent backgrounds
        online:
          "bg-green-500/15 text-green-600 border-green-500/30",
        offline:
          "bg-gray-500/15 text-gray-500 border-gray-500/30",
        error:
          "bg-red-500/15 text-red-500 border-red-500/30",
        warning:
          "bg-amber-500/15 text-amber-600 border-amber-500/30",
        processing:
          "bg-blue-500/15 text-blue-600 border-blue-500/30",
        ready:
          "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
        pending:
          "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
