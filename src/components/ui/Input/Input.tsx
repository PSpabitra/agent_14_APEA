import { forwardRef, useId } from "react";
import { cn } from "@/utils/cn";
import type { InputProps } from "./Input.types";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, fullWidth = true, className, id, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id || reactId;
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtext">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-subtext",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error && "border-danger focus:ring-danger",
            className,
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext">{rightIcon}</span>
        )}
      </div>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-subtext">{hint}</span>
      ) : null}
    </div>
  );
});
