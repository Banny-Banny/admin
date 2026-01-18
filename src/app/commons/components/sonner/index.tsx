"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
import styles from "./styles.module.css";
import { cn } from "../utils";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn(styles.c_1mpytb, styles.toaster)}
      {...props}
    />
  );
};

export { Toaster };
