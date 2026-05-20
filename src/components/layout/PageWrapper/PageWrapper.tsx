import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageWrapperProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageWrapper({ title, description, actions, children }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 px-4 py-6 md:px-6 space-y-6"
    >
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h1 className="text-xl font-semibold text-text">{title}</h1>}
            {description && <p className="mt-0.5 text-sm text-subtext">{description}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
