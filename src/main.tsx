import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { App } from "./App";
import { installInterceptors } from "@/services/api/interceptors";
import { useAuthStore } from "@/store/slices/auth";

installInterceptors(() => {
  useAuthStore.getState().clear();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
