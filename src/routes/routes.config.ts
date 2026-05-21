import { lazy } from "react";
import type { ComponentType } from "react";

export interface RouteDef {
  path: string;
  component: ComponentType;
  label: string;
  roles?: string[];
  public?: boolean;
}

export const ROUTES: RouteDef[] = [
  { path: "/",             component: lazy(() => import("@/pages/LandingPage")),    label: "Home",           public: true },
  { path: "/login",        component: lazy(() => import("@/pages/Login")),           label: "Login",          public: true },
  { path: "/dashboard",    component: lazy(() => import("@/pages/Dashboard")),       label: "Dashboard" },
  { path: "/exceptions",   component: lazy(() => import("@/pages/Exceptions")),      label: "Exceptions" },
  { path: "/tickets",      component: lazy(() => import("@/pages/Tickets")),         label: "Tickets" },
  { path: "/rca",          component: lazy(() => import("@/pages/RCA")),             label: "Root Cause" },
  { path: "/connectors",   component: lazy(() => import("@/pages/Connectors")),      label: "Connectors",     roles: ["admin"] },
  { path: "/ftp-connector",component: lazy(() => import("@/pages/FTPConnector")),    label: "FTP Connector",  roles: ["admin"] },
  { path: "/chatbot",      component: lazy(() => import("@/pages/Chatbot")),         label: "Assistant" },
  { path: "/reports",      component: lazy(() => import("@/pages/Reports")),         label: "Reports" },
  { path: "/settings",     component: lazy(() => import("@/pages/Settings")),        label: "Settings" },
];
