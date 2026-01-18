import * as React from "react";

import { cn } from "../utils";
import styles from "./styles.module.css";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        styles.c_5pzolt,
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
