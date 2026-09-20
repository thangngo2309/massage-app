import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      type = "button",
      disabled,
      loading = false,
      loadingText,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",

          variant === "primary" &&
            "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800",

          variant === "secondary" &&
            "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",

          variant === "outline" &&
            "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",

          variant === "ghost" &&
            "text-slate-600 hover:bg-slate-100 hover:text-slate-950",

          variant === "danger" && "bg-red-600 text-white hover:bg-red-700",

          size === "sm" && "h-9 px-3 text-sm",

          size === "md" && "h-11 px-4 text-sm",

          size === "lg" && "h-12 px-5 text-base",

          className
        )}
        {...props}
      >
        {loading ? loadingText ?? children : children}
      </button>
    );
  }
);

Button.displayName = "Button";
