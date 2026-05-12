import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef(({ className, layout = "vertical", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn(
        layout === "horizontal" ? "flex flex-wrap gap-4" : "grid gap-2",
        className
      )}
      {...props}
      ref={ref}
    />
  );
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const radioItemSizes = {
  sm: { item: "h-3.5 w-3.5", indicator: "h-2 w-2" },
  md: { item: "h-4 w-4",   indicator: "h-3.5 w-3.5" },
  lg: { item: "h-5 w-5",   indicator: "h-4 w-4" },
}

/**
 * RadioGroupItem — uso recomendado:
 *
 * <RadioGroupItem id="opt1" value="opt1"
 *   label="Opção 1"
 *   helperText="Descrição extra"
 *   icon={<SomeIcon className="h-4 w-4" />}
 *   hasError
 *   size="md"
 *   layout="horizontal"  ← "horizontal" coloca texto à direita; "vertical" empilha
 * />
 */
const RadioGroupItem = React.forwardRef(({
  className,
  size = "md",
  /** @deprecated use helperText */
  description,
  helperText,
  hasError,
  label,
  icon,
  layout = "horizontal",
  id,
  ...props
}, ref) => {
  const helpId = (helperText || description) ? `${id}-help` : undefined
  const sizes = radioItemSizes[size] ?? radioItemSizes.md

  const indicator = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={id}
      aria-describedby={helpId}
      className={cn(
        "aspect-square shrink-0 rounded-full border text-primary shadow",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        hasError ? "border-destructive" : "border-primary",
        sizes.item,
        className
      )}
      {...props}>
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle
          className={cn(sizes.indicator, hasError ? "fill-destructive" : "fill-primary")}
          aria-hidden="true"
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )

  // Se não há label/icon/helperText, retorna apenas o item nu (compatível com uso legado)
  if (!label && !icon && !helperText && !description) return indicator

  return (
    <div className={cn(
      "flex gap-2",
      layout === "vertical" ? "flex-col items-start" : "items-start"
    )}>
      {indicator}
      <div className="flex flex-col gap-0.5 leading-none">
        {(label || icon) && (
          <label
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 text-sm font-medium",
              hasError && "text-destructive"
            )}
          >
            {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
            {label}
          </label>
        )}
        {(helperText || description) && (
          <p id={helpId} className={cn("text-xs", hasError ? "text-destructive" : "text-muted-foreground")}>
            {helperText ?? description}
          </p>
        )}
      </div>
    </div>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }