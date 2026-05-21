import type { ReactNode } from "react";

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    footer?: ReactNode;
    children: ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}
