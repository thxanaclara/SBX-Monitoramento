import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded bg-elevated border border-border px-3 text-sm text-white placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
