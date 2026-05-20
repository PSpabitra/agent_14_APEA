import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useUiStore } from "@/store/slices/ui";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE_STYLES: Record<string, string> = {
  success: "border-success/40",
  error: "border-danger/40",
  info: "border-info/40",
  warning: "border-warning/40",
};

const TONE_ICON: Record<string, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-info",
  warning: "text-warning",
};

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant || "info"];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={cn(
                "pointer-events-auto flex gap-3 rounded-xl border bg-elevated p-3 pr-2 shadow-pop",
                TONE_STYLES[t.variant || "info"],
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", TONE_ICON[t.variant || "info"])} />
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-subtext">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-subtext hover:bg-muted hover:text-text"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
