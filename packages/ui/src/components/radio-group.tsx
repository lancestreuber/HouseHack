"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "@HouseHack/ui/lib/utils";
import * as React from "react";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("grid gap-1.5", className)} {...props} />;
}

const RadioGroupItem = React.forwardRef<React.ComponentRef<typeof Radio.Root>, Radio.Root.Props>(({ className, children, ...props }, ref) => {
  return (
    <Radio.Root
      ref={ref}
      data-slot="radio-group-item"
      className={cn(
        "relative flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input text-primary outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary dark:bg-input/30",
        className,
      )}
      {...props}
    >
      <Radio.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center [&>span]:size-2">
        <span className="size-2 rounded-full bg-current" />
      </Radio.Indicator>
    </Radio.Root>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };