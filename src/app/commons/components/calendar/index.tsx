"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "../utils";
import { buttonVariants } from "../button";
import styles from "./styles.module.css";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(styles.c_2c5y, className)}
      classNames={{
        months: styles.months,
        month: styles.month,
        caption: styles.caption,
        caption_label: styles.captionLabel,
        nav: styles.nav,
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          styles.navButton,
        ),
        nav_button_previous: styles.navButtonPrevious,
        nav_button_next: styles.navButtonNext,
        table: styles.table,
        head_row: styles.headRow,
        head_cell: styles.headCell,
        row: styles.row,
        cell: cn(
          styles.cell,
          props.mode === "range" ? styles.cellRange : styles.cellSingle,
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          styles.day,
        ),
        day_range_start: styles.dayRangeStart,
        day_range_end: styles.dayRangeEnd,
        day_selected: styles.daySelected,
        day_today: styles.dayToday,
        day_outside: styles.dayOutside,
        day_disabled: styles.dayDisabled,
        day_range_middle: styles.dayRangeMiddle,
        day_hidden: styles.dayHidden,
        ...classNames,
      }}
      components={{
        Chevron: ({
          className,
          orientation,
        }: {
          className?: string;
          orientation?: "left" | "right" | "up" | "down";
        }): React.ReactElement => {
          const Icon =
            orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn(styles.c_1k44y20, className ?? "")} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
