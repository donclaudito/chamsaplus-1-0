import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const separatorThickness = {
  sm: { horizontal: "h-[1px]", vertical: "w-[1px]" },
  md: { horizontal: "h-[2px]", vertical: "w-[2px]" },
  lg: { horizontal: "h-[3px]", vertical: "w-[3px]" },
}

const separatorStyle = {
  solid:  "",
  dashed: "[background:repeating-linear-gradient(90deg,currentColor_0,currentColor_6px,transparent_6px,transparent_12px)] bg-transparent",
  dotted: "[background:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_6px)] bg-transparent",
}

/**
 * Separator
 * - `size`: "sm" | "md" | "lg"  (espessura, padrão "sm")
 * - `variant`: "solid" | "dashed" | "dotted"
 * - `color`: classe Tailwind de cor, ex: "text-primary" (usa currentColor)
 */
const Separator = React.forwardRef((
  { className, orientation = "horizontal", decorative = true, size = "sm", variant = "solid", color, ...props },
  ref
) => {
  const thickness = separatorThickness[size] ?? separatorThickness.sm
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        variant === "solid" ? "bg-border" : "",
        separatorStyle[variant] ?? "",
        orientation === "horizontal"
          ? `${thickness.horizontal} w-full`
          : `h-full ${thickness.vertical}`,
        color,
        className
      )}
      {...props} />
  )
})
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }