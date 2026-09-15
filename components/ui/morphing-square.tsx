"use client";

import { cva } from "class-variance-authority";
import { HTMLMotionProps, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const morphingSquareVariants = cva("flex items-center justify-center gap-2", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
});

export interface MorphingSquareProps {
  message?: string;
  messagePlacement?: "top" | "bottom" | "left" | "right";
}

export function MorphingSquare({
  className,
  message,
  messagePlacement = "bottom",
  ...props
}: HTMLMotionProps<"div"> & MorphingSquareProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn(morphingSquareVariants({ messagePlacement }))}>
      <motion.div
        className={cn("h-10 w-10 bg-foreground", className)}
        animate={
          reducedMotion
            ? { opacity: [0.72, 1, 0.72] }
            : {
                borderRadius: ["6%", "50%", "6%"],
                transform: ["rotate(0deg)", "rotate(180deg)", "rotate(360deg)"],
              }
        }
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        aria-hidden={message ? true : undefined}
        {...props}
      />
      {message ? (
        <span className="text-sm text-ink-muted">{message}</span>
      ) : null}
    </div>
  );
}
