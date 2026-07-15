"use client";

import { cva } from "class-variance-authority";
import { HTMLMotionProps, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const waveLoaderVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
});

export interface WaveLoaderProps {
  /**
   * The number of bouncing bars to display.
   * @default 5
   */
  bars?: number;
  /**
   * Optional message to display alongside the bars.
   */
  message?: string;
  /**
   * Position of the message relative to the bars.
   * @default bottom
   */
  messagePlacement?: "bottom" | "left" | "right";
}

export function WaveLoader({
  bars = 5,
  message,
  messagePlacement,
  className,
  ...props
}: HTMLMotionProps<"div"> & WaveLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn(waveLoaderVariants({ messagePlacement }))}>
      <div className={cn("flex gap-1 items-center justify-center")}>
        {Array(bars)
          .fill(undefined)
          .map((_, index) => (
            <motion.div
              key={index}
              className={cn("w-2 h-5 bg-foreground origin-bottom", className)}
              animate={shouldReduceMotion ? { scaleY: 1 } : { scaleY: [1, 1.5, 1] }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.1,
                    }
              }
              {...props}
            />
          ))}
      </div>
      {message && <div>{message}</div>}
    </div>
  );
}
