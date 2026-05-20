export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || "APEA",
  fullName: "Autonomous Production Exception Agent",
  version: "1.0.0",
  storageKey: "apea",
  defaultTheme: "system" as "light" | "dark" | "system",
} as const;
