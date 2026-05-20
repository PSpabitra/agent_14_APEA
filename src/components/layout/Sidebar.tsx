import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, AlertTriangle, BookOpen,
  CheckSquare, TrendingUp, MessageCircle, FileText,
  ChevronLeft, ChevronRight, Zap, Moon, Sun
} from 'lucide-react';

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/telemetry',     icon: Activity,        label: 'Telemetry'   },
  { to: '/exceptions',    icon: AlertTriangle,   label: 'Exceptions'  },
  { to: '/playbooks',     icon: BookOpen,        label: 'Playbooks'   },
  { to: '/actions',       icon: CheckSquare,     label: 'Actions'     },
  { to: '/escalations',   icon: TrendingUp,      label: 'Escalations' },
  { to: '/chat',          icon: MessageCircle,   label: 'Ops Chat'    },
  { to: '/reports',       icon: FileText,        label: 'Reports'     },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('apea-theme', next ? 'dark' : 'light');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-300"
      style={{
        width: collapsed ? 64 : 'var(--sidebar-w)',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b flex-shrink-0"
           style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'var(--accent)' }}>
          <Zap size={16} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-display font-bold text-sm leading-tight"
               style={{ color: 'var(--text-primary)' }}>APEA</p>
            <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
              Exception Agent
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 mb-0.5 rounded-lg transition-all
               ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
               ${isActive
                 ? 'text-white font-medium'
                 : 'hover:bg-[var(--bg-card-hover)]'}`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent)' : undefined,
              color: isActive ? '#fff' : 'var(--text-secondary)',
            })}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t flex flex-col gap-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 rounded-lg transition-all hover:bg-[var(--bg-card-hover)]
                      ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}`}
          style={{ color: 'var(--text-muted)' }}
          title="Toggle theme"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span className="text-xs">Toggle theme</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`flex items-center gap-3 rounded-lg transition-all hover:bg-[var(--bg-card-hover)]
                      ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}`}
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed] = useState(false);
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-auto transition-all duration-300"
        style={{ marginLeft: collapsed ? 64 : 'var(--sidebar-w)' }}
      >
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
