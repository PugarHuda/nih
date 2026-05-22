"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Comic-style Button — Bangers display + hard 5px shadow + 3.5px ink border.
 * Variants map onto the design system's accent / accent-2 / accent-3 tokens
 * so every page picks up the same visual language as the landing.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none text-sm font-semibold tracking-wider uppercase transition-[transform,box-shadow] duration-75 active:translate-x-[2px] active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        // primary action — comic yellow with ink border
        default:
          "bg-[var(--accent)] text-[var(--accent-ink)] border-[3.5px] border-[var(--ink)] shadow-[5px_5px_0_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_0_var(--ink)] active:shadow-[2px_2px_0_0_var(--ink)]",
        // soft tertiary — paper background
        ghost:
          "bg-[var(--paper)] text-[var(--ink)] border-[3.5px] border-[var(--ink)] shadow-[5px_5px_0_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_0_var(--ink)] active:shadow-[2px_2px_0_0_var(--ink)]",
        // outline — transparent background, just the comic border
        outline:
          "bg-transparent text-[var(--ink)] border-[3.5px] border-[var(--ink)] shadow-[5px_5px_0_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_0_var(--ink)] active:shadow-[2px_2px_0_0_var(--ink)]",
        // bold dark button on white sections
        secondary:
          "bg-[var(--ink)] text-[var(--paper)] border-[3.5px] border-[var(--ink)] shadow-[5px_5px_0_0_var(--accent)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_0_var(--accent)] active:shadow-[2px_2px_0_0_var(--accent)]",
        // destructive
        danger:
          "bg-[var(--accent-2)] text-[var(--paper)] border-[3.5px] border-[var(--ink)] shadow-[5px_5px_0_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_0_var(--ink)] active:shadow-[2px_2px_0_0_var(--ink)]",
        // text-only link
        link: "bg-transparent border-0 shadow-none text-[var(--accent-2)] underline underline-offset-4 hover:opacity-80",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 px-3 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const fontStyle: React.CSSProperties = {
      fontFamily: "var(--font-display)",
      letterSpacing: ".04em",
      ...style,
    };
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={fontStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
