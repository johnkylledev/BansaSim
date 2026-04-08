import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  colorClass?: string;
  trackColorClass?: string;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  colorClass = "bg-primary",
  trackColorClass = "bg-primary/20",
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn("relative h-1.5 w-full grow overflow-hidden rounded-full", trackColorClass)}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn("absolute h-full", colorClass)}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block h-5 w-5 rounded-full border bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
            colorClass.replace('bg-', 'border-')
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
