import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* Hallmark · component: HallmarkButton · genre: editorial · theme: Ochre
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

export interface HallmarkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  state?: "default" | "loading" | "error" | "success";
  errorMessage?: string;
  successMessage?: string;
}

export const HallmarkButton = React.forwardRef<
  HTMLButtonElement,
  HallmarkButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      state = "default",
      disabled,
      children,
      errorMessage = "Gagal",
      successMessage = "Berhasil",
      ...props
    },
    ref,
  ) => {
    const isLoading = state === "loading";
    const isError = state === "error";
    const isSuccess = state === "success";
    const isDisabled = disabled || isLoading;

    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100";

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 text-sm rounded-xl gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-primary text-primary-foreground font-semibold shadow-sm hover:brightness-105 hover:shadow-md",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline:
        "border border-border bg-card/60 backdrop-blur-sm text-foreground hover:bg-muted/80 hover:border-foreground/20",
      ghost:
        "text-foreground hover:bg-muted/60 hover:text-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };

    const stateModifier = {
      default: "",
      loading: "cursor-wait",
      error: "border-destructive text-destructive bg-destructive/10",
      success: "border-success text-success bg-success/10",
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        data-state={state}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          stateModifier[state],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {isError && (
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" aria-hidden="true" />
        )}
        {isSuccess && (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
        )}

        {isError ? (
          <span>{errorMessage}</span>
        ) : isSuccess ? (
          <span>{successMessage}</span>
        ) : (
          children
        )}
      </button>
    );
  },
);

HallmarkButton.displayName = "HallmarkButton";
