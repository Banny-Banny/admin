import * as React from "react";

import { cn } from "../utils";
import styles from "./styles.module.css";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        styles.c_1mhc3zn,
        styles.c_p1p9h3,
        styles.c_k039fw,
        className,
      )}
      {...props}
    />
  );
}

export { Input };
