"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../utils";
import styles from "./styles.module.css";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const progressValue = Math.max(0, Math.min(100, value ?? 0));
  const valueClass =
    styles[`value${Math.round(progressValue)}` as keyof typeof styles];

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        styles.c_1gjbx0b,
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          styles.c_5uxewn,
          valueClass,
        )}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
