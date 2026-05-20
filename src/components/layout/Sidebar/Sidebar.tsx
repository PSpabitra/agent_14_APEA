import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Ticket,
  Brain,
  PlugZap,
  MessagesSquare,
  FileText,
  Settings as SettingsIcon,
  Database,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useUiStore } from "@/store/slices/ui";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/connectors", label: "Connectors", icon: PlugZap },
  { to: "/exceptions", label: "Exceptions", icon: AlertTriangle },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/rca", label: "Root Cause", icon: Brain },
  { to: "/chatbot", label: "Assistant", icon: MessagesSquare },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const open = useUiStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "border-r border-border bg-surface transition-all duration-200 ease-out",
        "hidden md:flex md:flex-col",
        open ? "md:w-60" : "md:w-16",
      )}
    >
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-subtext hover:bg-muted hover:text-text",
              )
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className={cn("border-t border-border p-3 text-xs text-subtext flex items-center gap-2", !open && "justify-center")}>
        <Database className="h-3.5 w-3.5" />
        {open && <span>v1.0.0 · MVP</span>}
      </div>
    </aside>
  );
}
