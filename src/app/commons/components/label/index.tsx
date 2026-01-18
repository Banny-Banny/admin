"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "../utils";
import styles from "./styles.module.css";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        styles.c_5tp59e,
        className,
      )}
      {...props}
    />
  );
}

export { Label };
