"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => {
  const pct = value || 0
  const indicatorColor =
    pct >= 100 ? "bg-green-500" :
    pct >= 50  ? "bg-primary" :
    pct >= 25  ? "bg-amber-500" :
    "bg-destructive"

  return (
    <ProgressPrimitive.Root
      ref={ref}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${pct}%`}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}>
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all duration-500", indicatorColor)}
        style={{ transform: `translateX(-${100 - pct}%)` }} />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }