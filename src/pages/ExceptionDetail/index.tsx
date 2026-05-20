import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exceptionApi, rcaApi, actionApi, escalationApi, reportApi } from '@/services/api/client';
import { ExceptionDetail as IExceptionDetail, RcaHypothesis } from '@/types/apea.types';
import {
  SeverityBadge, StatusBadge, RiskScoreBar, Spinner, PageHeader,
  TimelineDot, fmtDate, fmtRelative
} from '@/components/ui/shared';
import {
  Brain, Wrench, TrendingUp, Clock, FileText, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Download, Play
} from 'lucide-react';

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden mb-4">
      <button
        className="w-full flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'transparent' }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 font-display font-semibold text-sm"
             style={{ color: 'var(--text-primary)' }}>
          {icon}{title}
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
               : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
};

export const ExceptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const excId   = parseInt(id || '0');
  const qc      = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [actionTitle, setActionTitle] = useState('');

  const { data, isLoading } = useQuery<IExceptionDetail>({
    queryKey: ['exception', excId],
    queryFn: () => exceptionApi.getById(excId).then(r => r.data),
    enabled: !!excId,
  });

  const runRca = useMutation({
    mutationFn: () => rcaApi.analyze(excId, { owner_input: ownerInput }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exception', excId] })
  });

  const setStatus = useMutation({
    mutationFn: () => exceptionApi.setStatus(excId, { status: newStatus, reason: statusReason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exception', excId] }); setNewStatus(''); }
  });

  const createAction = useMutation({
    mutationFn: () => actionApi.create(excId, { title: actionTitle }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exception', excId] }); setActionTitle(''); }
  });

  const escalate = useMutation({
    mutationFn: () => escalationApi.evaluate(excId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exception', excId] })
  });

  const genReport = useMutation({
    mutationFn: () => reportApi.generate(excId),
    onSuccess: (r) => alert(`Report generated! ID: ${r.data.report_id}`)
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner size={32} /></div>;
  if (!data) return <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Exception not found</div>;

  const exc = data.exception || data;
  const rca = data.rca;
  const actions = data.corrective_actions || [];
  const escalations = data.escalations || [];
  const audit = data.audit_trail || [];
  const hyps: RcaHypothesis[] = rca?.hypotheses
    ? (typeof rca.hypotheses === 'string' ? JSON.parse(rca.hypotheses) : rca.hypotheses)
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={exc.exception_ref || 'Exception Detail'}
        subtitle={exc.title}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs" onClick={() => escalate.mutate()}
                    disabled={escalate.isPending}>
              {escalate.isPending ? <Spinner size={13} /> : <TrendingUp size={13} />} Escalate
            </button>
            <button className="btn-primary text-xs" onClick={() => genReport.mutate()}
                    disabled={genReport.isPending}>
              {genReport.isPending ? <Spinner size={13} /> : <FileText size={13} />} Report
            </button>
          </div>
        }
      />

      {/* Meta strip */}
      <div className="card p-5 mb-4 flex flex-wrap items-center gap-4">
        <SeverityBadge label={exc.severity} variant={exc.severity} />
        <StatusBadge status={exc.status} />
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Clock size={13} /> SLA: {fmtDate(exc.sla_deadline)}
          {exc.sla_breached && <span className="font-bold" style={{ color: 'var(--critical)' }}>BREACHED</span>}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Plant: <strong style={{ color: 'var(--text-secondary)' }}>{exc.plant_name}</strong> /
          Line: <strong style={{ color: 'var(--text-secondary)' }}>{exc.line_name}</strong>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Risk Score</span>
          <div className="w-32"><RiskScoreBar score={exc.risk_score} level={exc.risk_level} /></div>
        </div>
      </div>

      {/* Status change */}
      <Section title="Change Status" icon={<CheckCircle size={15} />}>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input-field w-48" value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}>
            <option value="">Select new status…</option>
            {['new','triaging','action_pending','escalated','monitoring','resolved','reopened','closed'].map(s => (
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </select>
          <input className="input-field flex-1" placeholder="Reason for change…"
                 value={statusReason} onChange={e => setStatusReason(e.target.value)} />
          <button className="btn-primary" onClick={() => setStatus.mutate()}
                  disabled={!newStatus || setStatus.isPending}>
            {setStatus.isPending ? <Spinner size={14} /> : <Play size={14} />} Apply
          </button>
        </div>
        {setStatus.isError && <p className="text-xs mt-2" style={{ color: 'var(--critical)' }}>{(setStatus.error as Error).message}</p>}
      </Section>

      {/* RCA */}
      <Section title="Root Cause Analysis" icon={<Brain size={15} />}>
        {rca ? (
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Top Cause: <span style={{ color: 'var(--accent)' }}>{rca.top_cause}</span>
            </p>
            <div className="space-y-2">
              {hyps.map((h) => (
                <div key={h.rank} className="flex items-start gap-3 p-3 rounded-lg"
                     style={{ background: 'var(--bg-secondary)' }}>
                  <span className="font-mono text-xs font-bold w-6 text-center pt-0.5"
                        style={{ color: 'var(--accent)' }}>#{h.rank || h.rank === 0 ? h.rank : '?'}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{h.cause}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Confidence: {(h.confidence * 100).toFixed(0)}% · {h.evidence?.join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {rca.owner_input && (
              <p className="text-xs mt-3 p-3 rounded-lg" style={{ background: 'var(--low-bg)', color: 'var(--low)' }}>
                Operator: {rca.owner_input}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              No RCA completed. Add optional owner input and run analysis.
            </p>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Owner input (optional)…"
                     value={ownerInput} onChange={e => setOwnerInput(e.target.value)} />
              <button className="btn-primary" onClick={() => runRca.mutate()}
                      disabled={runRca.isPending}>
                {runRca.isPending ? <Spinner size={14} /> : <Brain size={14} />} Analyze
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Corrective Actions */}
      <Section title="Corrective Actions" icon={<Wrench size={15} />}>
        <div className="flex gap-2 mb-4">
          <input className="input-field flex-1" placeholder="Action title…"
                 value={actionTitle} onChange={e => setActionTitle(e.target.value)} />
          <button className="btn-primary" onClick={() => createAction.mutate()}
                  disabled={!actionTitle || createAction.isPending}>
            {createAction.isPending ? <Spinner size={14} /> : null} + Add
          </button>
        </div>
        {actions.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No corrective actions yet.</p>
        ) : (
          <div className="space-y-2">
            {actions.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg"
                   style={{ background: 'var(--bg-secondary)' }}>
                <CheckCircle size={14} style={{ color: a.status === 'complete' ? 'var(--low)' : 'var(--text-muted)' }} />
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {a.ticket_id} · {a.assigned_to} · {a.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Escalation History */}
      <Section title="Escalation History" icon={<TrendingUp size={15} />}>
        {escalations.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No escalations recorded.</p>
        ) : (
          <div className="space-y-3">
            {escalations.map(e => (
              <div key={e.id} className="flex items-start gap-3">
                <TimelineDot color="var(--critical)" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Level {e.escalation_level?.toUpperCase()} · {fmtDate(e.escalated_at)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Audit Trail */}
      <Section title="Audit Trail" icon={<Clock size={15} />}>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {audit.map(a => (
            <div key={a.id} className="flex items-start gap-3">
              <TimelineDot />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                  <span className="font-semibold">{a.action}</span>
                  <span style={{ color: 'var(--text-muted)' }}> by {a.performed_by} ({a.agent_name || 'system'})</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {fmtDate(a.created_at)} {a.notes && `· ${a.notes}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default ExceptionDetailPage;
