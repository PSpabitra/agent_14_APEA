import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { exceptionApi, escalationApi } from '@/services/api/client';
import { EscalationEvent, ExceptionCase } from '@/types/apea.types';
import { PageHeader, SeverityBadge, Spinner, EmptyState, fmtDate } from '@/components/ui/shared';
import { TrendingUp, Bell, Mail, Slack, Monitor, CheckCircle, ChevronRight } from 'lucide-react';

const LEVEL_COLOR: Record<string, string> = {
  l1: '#6366f1', l2: '#d97706', l3: '#dc2626', executive: '#7c3aed',
};
const LEVEL_LABEL: Record<string, string> = {
  l1: 'L1 — Operations', l2: 'L2 — Manager', l3: 'L3 — Director', executive: 'Executive',
};

interface EscalationWithMeta extends EscalationEvent {
  exception_ref?: string;
  exception_title?: string;
  exception_severity?: string;
}

const ChannelIcon: React.FC<{ ch: string }> = ({ ch }) => {
  if (ch === 'email')  return <Mail size={12} />;
  if (ch === 'slack')  return <Slack size={12} />;
  if (ch === 'teams')  return <Monitor size={12} />;
  return <Bell size={12} />;
};

export const EscalationTimelinePage: React.FC = () => {
  const qc = useQueryClient();
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null);

  // Gather escalations from all exceptions
  const { data: excData, isLoading: excLoading } = useQuery({
    queryKey: ['exceptions-for-escalations'],
    queryFn: () => exceptionApi.list({ limit: 200 }).then(r => r.data),
  });

  const { data: escalations, isLoading: escLoading, refetch } = useQuery<EscalationWithMeta[]>({
    queryKey: ['all-escalations'],
    queryFn: async () => {
      const exceptions: ExceptionCase[] = excData?.data || [];
      const results: EscalationWithMeta[] = [];
      await Promise.all(
        exceptions.slice(0, 40).map(async (exc) => {
          try {
            const detail = await exceptionApi.getById(exc.id).then(r => r.data);
            const escs = detail.escalations || [];
            escs.forEach((e: EscalationEvent) => {
              results.push({
                ...e,
                exception_ref: exc.exception_ref,
                exception_title: exc.title,
                exception_severity: exc.severity,
              });
            });
          } catch {/* skip */}
        })
      );
      results.sort((a, b) =>
        new Date(b.escalated_at).getTime() - new Date(a.escalated_at).getTime()
      );
      return results;
    },
    enabled: !!excData,
  });

  const evaluate = useMutation({
    mutationFn: (id: number) => escalationApi.evaluate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions-for-escalations'] });
      qc.invalidateQueries({ queryKey: ['all-escalations'] });
      setEvaluatingId(null);
      refetch();
    },
  });

  const isLoading = excLoading || escLoading;

  const stats = {
    total:     (escalations || []).length,
    l1:        (escalations || []).filter(e => e.escalation_level === 'l1').length,
    l2:        (escalations || []).filter(e => e.escalation_level === 'l2').length,
    l3:        (escalations || []).filter(e => e.escalation_level === 'l3').length,
    executive: (escalations || []).filter(e => e.escalation_level === 'executive').length,
    unacked:   (escalations || []).filter(e => !e.acknowledged).length,
  };

  return (
    <div>
      <PageHeader
        title="Escalation Timeline"
        subtitle="Chronological history of all escalation events"
        actions={
          evaluatingId !== null ? (
            <div className="flex items-center gap-2 card px-3 py-1.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Evaluate exception ID:</span>
              <input
                className="input-field w-20 py-1 text-xs"
                type="number"
                value={evaluatingId || ''}
                onChange={e => setEvaluatingId(parseInt(e.target.value) || null)}
              />
              <button
                className="btn-primary py-1 text-xs"
                onClick={() => evaluatingId && evaluate.mutate(evaluatingId)}
                disabled={evaluate.isPending}
              >
                {evaluate.isPending ? <Spinner size={13} /> : <TrendingUp size={13} />} Escalate
              </button>
              <button className="btn-ghost py-1 text-xs" onClick={() => setEvaluatingId(null)}>✕</button>
            </div>
          ) : (
            <button className="btn-primary text-xs" onClick={() => setEvaluatingId(0)}>
              <TrendingUp size={13} /> Evaluate Escalation
            </button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total',     value: stats.total,     color: 'var(--accent)' },
          { label: 'L1',        value: stats.l1,         color: LEVEL_COLOR.l1 },
          { label: 'L2',        value: stats.l2,         color: LEVEL_COLOR.l2 },
          { label: 'L3',        value: stats.l3,         color: LEVEL_COLOR.l3 },
          { label: 'Executive', value: stats.executive,  color: LEVEL_COLOR.executive },
          { label: 'Unacked',   value: stats.unacked,    color: 'var(--critical)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : !escalations || escalations.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={36} />}
          title="No escalations recorded"
          desc="Escalations are triggered automatically when risk thresholds are breached."
        />
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[22px] top-4 bottom-4 w-0.5"
            style={{ background: 'var(--border)' }}
          />

          <div className="space-y-4 pl-12">
            {escalations.map((e, idx) => {
              const color  = LEVEL_COLOR[e.escalation_level] || 'var(--accent)';
              const label  = LEVEL_LABEL[e.escalation_level] || e.escalation_level;
              let channels: string[] = [];
              try { channels = e.channels ? JSON.parse(e.channels) : []; } catch {}
              let recipients: string[] = [];
              try { recipients = e.notified_to ? JSON.parse(e.notified_to) : []; } catch {}

              return (
                <div key={e.id} className="relative animate-slide-up"
                     style={{ animationDelay: `${idx * 50}ms` }}>
                  {/* Dot on timeline */}
                  <div
                    className="absolute -left-12 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{
                      background: color,
                      borderColor: 'var(--bg-primary)',
                      boxShadow: `0 0 0 3px ${color}30`,
                      top: '12px',
                    }}
                  />

                  <div className="card p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Level badge + time */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="badge-base text-xs px-2.5 py-1 font-semibold"
                            style={{ background: `${color}18`, color }}
                          >
                            {label}
                          </span>
                          {!e.acknowledged && (
                            <span className="badge-base badge-critical text-xs">Unacknowledged</span>
                          )}
                          {e.acknowledged && (
                            <span className="flex items-center gap-1 text-xs"
                                  style={{ color: 'var(--low)' }}>
                              <CheckCircle size={11} /> Acked by {e.acknowledged_by}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {fmtDate(e.escalated_at)}
                          </span>
                        </div>

                        {/* Reason */}
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                          {e.reason}
                        </p>

                        {/* Exception link */}
                        {e.exception_ref && (
                          <Link
                            to={`/exceptions/${e.exception_id}`}
                            className="inline-flex items-center gap-1 text-xs mb-2 hover:underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            {e.exception_ref}
                            {e.exception_severity && (
                              <SeverityBadge
                                label={e.exception_severity}
                                variant={e.exception_severity as any}
                                size="sm"
                              />
                            )}
                            <ChevronRight size={11} />
                          </Link>
                        )}

                        {/* Channels */}
                        {channels.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Notified via:</span>
                            {channels.map(ch => (
                              <span
                                key={ch}
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                              >
                                <ChannelIcon ch={ch} />{ch}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Recipients */}
                        {recipients.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>To:</span>
                            {recipients.map(r => (
                              <span key={r} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Escalation ID */}
                      <span className="font-mono text-xs flex-shrink-0"
                            style={{ color: 'var(--text-muted)' }}>
                        #{e.id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationTimelinePage;
