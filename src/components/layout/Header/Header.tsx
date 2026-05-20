import { Bell, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useUiStore } from "@/store/slices/ui";
import { notificationApi } from "@/services/api/endpoints";
import { APP_CONFIG } from "@/config/app.config";

export function Header() {
  const { user, logout } = useAuth();
  const toggle = useUiStore((s) => s.toggleSidebar);
  const unread = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationApi.unreadCount().then((r) => r.count),
    refetchInterval: 30_000,
    enabled: Boolean(user),
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-md p-1.5 text-subtext hover:bg-muted hover:text-text md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-fg">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-text">{APP_CONFIG.name}</p>
            <p className="text-[10px] text-subtext">Production Exception Agent</p>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 text-xs text-subtext sm:inline-flex">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-success" /> Live sync
        </span>
        <Link to="/notifications" className="relative rounded-md p-1.5 text-subtext hover:bg-muted hover:text-text">
          <Bell className="h-5 w-5" />
          {unread.data && unread.data > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread.data > 99 ? "99+" : unread.data}
            </span>
          ) : null}
        </Link>
        <ThemeToggle />
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-text leading-tight">{user.full_name}</p>
              <Badge tone="primary" className="mt-0.5 capitalize">
                {user.role}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()} leftIcon={<LogOut className="h-4 w-4" />}>
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
