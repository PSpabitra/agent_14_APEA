import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { exceptionApi, workflowApi } from '@/services/api/client';
import { ExceptionCase, ExceptionStatus, Severity } from '@/types/apea.types';
import { PageHeader, SeverityBadge, StatusBadge, RiskScoreBar, Spinner, EmptyState, fmtRelative } from '@/components/ui/shared';
import { AlertTriangle, Play, ChevronRight, Filter } from 'lucide-react';

export const ExceptionsListPage: React.FC = () => {
  const qc = useQueryClient();
  const [filterSev,  setFilterSev]  = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [runId, setRunId] = useState('');
  const [runResult, setRunResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['exceptions', filterSev, filterStat],
    queryFn: () => exceptionApi.list({
      severity: filterSev || undefined,
      status: filterStat || undefined,
      limit: 100
    }).then(r => r.data),
  });

  const runWorkflow = useMutation({
    mutationFn: (deviation_id: number) => workflowApi.run({ deviation_id }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      setRunResult(JSON.stringify(r.data, null, 2));
    }
  });

  const rows: ExceptionCase[] = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Exceptions"
        subtitle={`${rows.length} exception cases`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 card px-3 py-1.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Run workflow for deviation:</span>
              <input className="input-field w-24 py-1 text-xs" placeholder="deviation ID"
                     value={runId} onChange={e => setRunId(e.target.value)} />
              <button className="btn-primary py-1 text-xs"
                      onClick={() => runId && runWorkflow.mutate(parseInt(runId))}
                      disabled={runWorkflow.isPending}>
                {runWorkflow.isPending ? <Spinner size={13} /> : <Play size={13} />}
                Run
              </button>
            </div>
          </div>
        }
      />

      {runResult && (
        <div className="card p-4 mb-4 text-xs font-mono" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Workflow Result</span>
            <button onClick={() => setRunResult(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
          <pre className="whitespace-pre-wrap text-xs" style={{ color: 'var(--text-secondary)' }}>{runResult}</pre>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <select className="input-field w-auto py-1.5 text-xs" value={filterSev}
                onChange={e => setFilterSev(e.target.value)}>
          <option value="">All severities</option>
          {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field w-auto py-1.5 text-xs" value={filterStat}
                onChange={e => setFilterStat(e.target.value)}>
          <option value="">All statuses</option>
          {['new','triaging','action_pending','escalated','monitoring','resolved','reopened','closed'].map(s =>
            <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        {(filterSev || filterStat) && (
          <button className="text-xs" style={{ color: 'var(--accent)' }}
                  onClick={() => { setFilterSev(''); setFilterStat(''); }}>
            Clear
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<AlertTriangle size={36} />} title="No exceptions found"
                      desc="Run the exception workflow to create cases from deviations." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  {['Ref','Title','Plant / Line','Severity','Status','Risk Score','SLA','Opened',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}
                      className="border-t transition-colors hover:bg-[var(--bg-card-hover)]"
                      style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: 'var(--accent)' }}>
                      {r.exception_ref}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {r.plant_name}<br/><span style={{ color: 'var(--text-muted)' }}>{r.line_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge label={r.severity} variant={r.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 w-32">
                      <RiskScoreBar score={r.risk_score} level={r.risk_level} />
                    </td>
                    <td className="px-4 py-3">
                      {r.sla_breached
                        ? <span className="text-xs font-semibold" style={{ color: 'var(--critical)' }}>BREACHED</span>
                        : <span style={{ color: 'var(--text-muted)' }}>{fmtRelative(r.sla_deadline)}</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                      {fmtRelative(r.opened_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/exceptions/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs transition-colors"
                            style={{ color: 'var(--accent)' }}>
                        Detail <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExceptionsListPage;
