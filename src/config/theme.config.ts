export type ThemeMode = "light" | "dark" | "system";

export const THEME_CONFIG = {
  storageKey: "apea-theme",
  modes: ["light", "dark", "system"] as const satisfies readonly ThemeMode[],
} as const;
