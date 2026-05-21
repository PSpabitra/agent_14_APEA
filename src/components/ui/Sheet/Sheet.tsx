import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";
import type { SheetProps } from "./Sheet.types";

const SIZE_STYLES = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-2xl",
    full: "max-w-full",
};

export function Sheet({ open, onClose, title, description, footer, size = "md", children }: SheetProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            "relative z-10 h-full w-full bg-surface border-l border-border shadow-2xl flex flex-col",
                            SIZE_STYLES[size],
                        )}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                            <div>
                                {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
                                {description && <p className="mt-1 text-xs text-subtext">{description}</p>}
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-1 rounded-md p-1.5 text-subtext hover:bg-muted hover:text-text transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>

                        {footer && (
                            <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-muted/20">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
