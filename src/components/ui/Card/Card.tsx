import { cn } from "@/utils/cn";
import type { CardProps } from "./Card.types";

export function Card({ title, description, action, padded = true, className, children, ...rest }: CardProps) {
  return (
    <div className={cn("card", className)} {...rest}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-text">{title}</h3>}
            {description && <p className="text-xs text-subtext mt-0.5">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </div>
  );
}
