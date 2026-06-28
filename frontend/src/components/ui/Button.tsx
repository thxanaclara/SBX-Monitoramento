import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs",
        variant === "primary" && "bg-accent text-white hover:bg-accent-dim",
        variant === "secondary" && "bg-elevated text-white border border-border hover:border-accent",
        variant === "ghost" && "bg-transparent text-muted hover:text-white hover:bg-elevated",
        variant === "danger" && "bg-signal-red/10 text-signal-red border border-signal-red/30 hover:bg-signal-red/20",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
