import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * ScrollArea
 * - `scrollbarVisibility`: "auto" (padrão) | "always" | "hidden"
 * - `smooth`: ativa scroll suave via CSS
 * - `thumbClassName`: classe extra para o polegar da scrollbar
 */
const ScrollArea = React.forwardRef(({
  className,
  children,
  scrollbarVisibility = "auto",
  smooth = false,
  thumbClassName,
  orientation = "vertical",
  ...props
}, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}>
    <ScrollAreaPrimitive.Viewport
      className={cn(
        "h-full w-full rounded-[inherit]",
        smooth && "[scroll-behavior:smooth]"
      )}>
      {children}
    </ScrollAreaPrimitive.Viewport>
    {scrollbarVisibility !== "hidden" && (
      <ScrollBar
        orientation={orientation}
        forceMount={scrollbarVisibility === "always" ? true : undefined}
        thumbClassName={thumbClassName}
      />
    )}
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef(({
  className,
  orientation = "vertical",
  thumbClassName,
  ...props
}, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn("relative flex-1 rounded-full bg-border", thumbClassName)}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }