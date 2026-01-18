import { cn } from "../utils";
import styles from "./styles.module.css";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(styles.c_11dx6vs, className)}
      {...props}
    />
  );
}

export { Skeleton };
