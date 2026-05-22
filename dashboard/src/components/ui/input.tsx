import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, style, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full px-3.5 py-2 text-base placeholder:opacity-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        border: "3.5px solid var(--ink)",
        boxShadow: "inset 0 2px 0 0 rgba(0,0,0,.04)",
        fontFamily: "var(--font-body)",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "inset 0 2px 0 0 rgba(0,0,0,.04), 0 0 0 3px var(--accent)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "inset 0 2px 0 0 rgba(0,0,0,.04)";
      }}
      {...props}
    />
  )
);
Input.displayName = "Input";
