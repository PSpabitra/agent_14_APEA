import React from 'react';
import { Severity, ExceptionStatus, RiskLevel } from '@/types/apea.types';
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, Loader2 } from 'lucide-react';

// ── Badge ──────────────────────────────────────────────────────
interface BadgeProps { label: string; variant: Severity | 'all'; size?: 'sm' | 'md'; }
export const SeverityBadge: React.FC<BadgeProps> = ({ label, variant, size = 'md' }) => {
  const cls: Record<string, string> = {
    critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', all: 'badge-low'
  };
  return (
    <span className={`badge-base ${cls[variant] || 'badge-low'} ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}`}>
      {variant === 'critical' && <Zap className="w-3 h-3" />}
      {label}
    </span>
  );
};

// ── Status Badge ───────────────────────────────────────────────
const STATUS_STYLES: Record<ExceptionStatus, string> = {
  new:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  triaging:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  action_pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  escalated:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  monitoring:     'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  resolved:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  reopened:       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  closed:         'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
export const StatusBadge: React.FC<{ status: ExceptionStatus }> = ({ status }) => (
  <span className={`badge-base ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status.replace('_', ' ')}
  </span>
);

// ── Risk Score Bar ─────────────────────────────────────────────
export const RiskScoreBar: React.FC<{ score: number; level: RiskLevel }> = ({ score, level }) => {
  const colors: Record<RiskLevel, string> = {
    low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500'
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className={`h-full rounded-full transition-all ${colors[level]}`}
             style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
        {score.toFixed(0)}
      </span>
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; color?: string; sub?: string; }
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = 'var(--accent)', sub }) => (
  <div className="card p-5 flex items-start gap-4 animate-slide-up">
    <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  </div>
);

// ── Loading Spinner ────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Loader2 size={size} className="animate-spin" style={{ color: 'var(--accent)' }} />
);

// ── Empty State ────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; desc?: string }> = ({
  icon, title, desc
}) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
      {icon || <CheckCircle size={40} />}
    </div>
    <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</p>
    {desc && <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
  </div>
);

// ── Page Header ────────────────────────────────────────────────
export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title, subtitle, actions
}) => (
  <div className="flex items-start justify-between mb-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ── Timeline dot ───────────────────────────────────────────────
export const TimelineDot: React.FC<{ color?: string; size?: number }> = ({ color = 'var(--accent)', size = 8 }) => (
  <div className="rounded-full border-2 flex-shrink-0"
       style={{ width: size, height: size, background: color, borderColor: 'var(--bg-card)' }} />
);

// ── formatDate helper ──────────────────────────────────────────
export const fmtDate = (d?: string) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
  } catch { return d; }
};

export const fmtRelative = (d?: string) => {
  if (!d) return '—';
  try {
    const ms   = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return d; }
};
