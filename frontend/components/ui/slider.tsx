"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

type SliderProps = Omit<
  SliderPrimitive.Root.Props,
  "value" | "defaultValue" | "onValueChange"
> & {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (values: number[]) => void;
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: SliderProps) {
  const currentValues = value ?? defaultValue ?? [min];

  function handleValueChange(nextValue: number | readonly number[]) {
    const normalized = Array.isArray(nextValue)
      ? Array.from(nextValue)
      : [nextValue];

    onValueChange?.(normalized);
  }

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "data-horizontal:w-full data-vertical:h-full",
        className
      )}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-horizontal:min-h-9 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-9 data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow cursor-pointer overflow-hidden rounded-full bg-white/60 shadow-inner data-horizontal:h-2.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-2.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-blue-600 data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>

        {currentValues.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            data-slot="slider-thumb"
            className="relative block size-5 shrink-0 cursor-grab rounded-full border-4 border-white bg-blue-600 shadow-xl ring-1 ring-zinc-300 transition-transform after:absolute after:-inset-3 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 active:cursor-grabbing active:scale-110 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
