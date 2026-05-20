import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  AlertTriangle, Zap, Clock, TrendingUp, Activity, ChevronRight
} from 'lucide-react';
import { dashboardApi } from '@/services/api/client';
import { DashboardSummary, ExceptionCase } from '@/types/apea.types';
import { StatCard, SeverityBadge, StatusBadge, RiskScoreBar, Spinner, fmtRelative, PageHeader } from '@/components/ui/shared';

const SEV_COLORS = { critical: '#dc2626', high: '#d97706', medium: '#ca8a04', low: '#16a34a' };

export const ExceptionDashboard: React.FC = () => {
  const { data, isLoading, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.summary().then(r => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Spinner size={32} />
    </div>
  );

  const m = data?.metrics;
  const sevData = Object.entries(data?.severity_counts || {}).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(data?.status_counts || {})
    .filter(([,v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  return (
    <div>
      <PageHeader
        title="Production Dashboard"
        subtitle="Real-time exception monitoring across all plants and studios"
        actions={
          <button onClick={() => refetch()} className="btn-ghost text-xs">
            <Activity size={14} /> Refresh
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Exceptions" value={m?.total_open || 0}
                  icon={<AlertTriangle size={20} />} color="#6366f1" />
        <StatCard label="Deviations (24h)" value={m?.recent_deviations_24h || 0}
                  icon={<Activity size={20} />} color="#d97706" />
        <StatCard label="SLA Breached" value={m?.sla_breached_open || 0}
                  icon={<Clock size={20} />} color="#dc2626" />
        <StatCard label="Avg Risk Score" value={`${(m?.avg_risk_score_open || 0).toFixed(1)}`}
                  icon={<TrendingUp size={20} />} color="#16a34a" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Telemetry trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Telemetry Ingestion (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data?.telemetry_trend || []}>
              <defs>
                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#tGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity donut */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Open by Severity
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sevData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                   dataKey="value" nameKey="name">
                {sevData.map((entry) => (
                  <Cell key={entry.name} fill={SEV_COLORS[entry.name as keyof typeof SEV_COLORS] || '#9ca3af'} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top risks + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopRisksTable rows={data?.top_risks || []} />
        <RecentExceptions rows={data?.recent_exceptions || []} />
      </div>
    </div>
  );
};

const TopRisksTable: React.FC<{ rows: ExceptionCase[] }> = ({ rows }) => (
  <div className="card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
        <Zap size={14} className="inline mr-1" style={{ color: '#dc2626' }} />
        Top Risk Exceptions
      </h3>
      <Link to="/exceptions" className="text-xs" style={{ color: 'var(--accent)' }}>
        View all <ChevronRight size={12} className="inline" />
      </Link>
    </div>
    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
      {rows.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No open exceptions</p>
      )}
      {rows.map(r => (
        <Link key={r.id} to={`/exceptions/${r.id}`}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg-card-hover)] block">
          <SeverityBadge label={r.severity} variant={r.severity} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.exception_ref} · {r.plant_name}</p>
            <div className="mt-1.5 max-w-[200px]">
              <RiskScoreBar score={r.risk_score} level={r.risk_level} />
            </div>
          </div>
          <StatusBadge status={r.status} />
        </Link>
      ))}
    </div>
  </div>
);

const RecentExceptions: React.FC<{ rows: ExceptionCase[] }> = ({ rows }) => (
  <div className="card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
    </div>
    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
      {rows.map(r => (
        <Link key={r.id} to={`/exceptions/${r.id}`}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg-card-hover)] block">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmtRelative(r.opened_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={r.status} />
            <SeverityBadge label={r.severity} variant={r.severity} size="sm" />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default ExceptionDashboard;
