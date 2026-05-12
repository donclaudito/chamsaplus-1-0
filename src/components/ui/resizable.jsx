"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

/**
 * ResizablePanelGroup — aceita `autoSaveId` para persistir tamanhos no localStorage.
 * Basta passar `autoSaveId="my-layout"` e o Radix/react-resizable-panels cuida do resto.
 */
const ResizablePanelGroup = ({
  className,
  autoSaveId,
  ...props
}) => (
  <ResizablePrimitive.PanelGroup
    autoSaveId={autoSaveId}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props} />
)

const ResizablePanel = ResizablePrimitive.Panel

/**
 * ResizableHandle
 * - `withHandle`: mostra o grip visual
 * - `tooltip`: texto exibido no title nativo ao hover (dica visual simples)
 * O handle fica destacado (bg-primary/40) enquanto é arrastado via data-[resize-handle-state=drag].
 */
const ResizableHandle = ({
  withHandle,
  tooltip,
  className,
  ...props
}) => (
  <ResizablePrimitive.PanelResizeHandle
    title={tooltip}
    className={cn(
      "group relative flex w-px items-center justify-center bg-border transition-colors",
      "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      // estado drag
      "data-[resize-handle-state=drag]:bg-primary/40",
      "data-[resize-handle-state=hover]:bg-primary/20",
      // vertical
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1",
      "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2",
      "data-[panel-group-direction=vertical]:after:translate-x-0",
      "[&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}>
    {withHandle && (
      <div className={cn(
        "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border transition-colors",
        "group-data-[resize-handle-state=drag]:border-primary group-data-[resize-handle-state=drag]:bg-primary/10",
      )}>
        <GripVertical className="h-2.5 w-2.5" aria-hidden="true" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }