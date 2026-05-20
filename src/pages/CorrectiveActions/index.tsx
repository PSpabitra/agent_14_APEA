import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { exceptionApi, actionApi } from '@/services/api/client';
import { ExceptionCase, CorrectiveAction } from '@/types/apea.types';
import {
  PageHeader, SeverityBadge, Spinner, EmptyState, fmtDate, fmtRelative
} from '@/components/ui/shared';
import { CheckSquare, CheckCircle, Clock, ExternalLink, ChevronRight } from 'lucide-react';

const ACTION_STATUS_STYLES: Record<string, string> = {
  open:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  pending_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  complete:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled:      'bg-gray-100 text-gray-500',
};

interface ActionWithException extends CorrectiveAction {
  exception_ref?: string;
  exception_severity?: string;
}

export const CorrectiveActionsPage: React.FC = () => {
  const qc = useQueryClient();
  const [closingId, setClosingId] = useState<number | null>(null);
  const [closureNote, setClosureNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Load all open exceptions then aggregate their actions
  const { data: excData, isLoading: excLoading } = useQuery({
    queryKey: ['exceptions-for-actions'],
    queryFn: () => exceptionApi.list({ limit: 200 }).then(r => r.data),
  });

  const { data: actionData, isLoading: actLoading, refetch } = useQuery({
    queryKey: ['all-actions', filterStatus],
    queryFn: async () => {
      const exceptions: ExceptionCase[] = excData?.data || [];
      const results: ActionWithException[] = [];
      await Promise.all(
        exceptions.slice(0, 30).map(async (exc) => {
          try {
            const detail = await exceptionApi.getById(exc.id).then(r => r.data);
            const acts = detail.corrective_actions || [];
            acts.forEach((a: CorrectiveAction) => {
              results.push({
                ...a,
                exception_ref: exc.exception_ref,
                exception_severity: exc.severity,
              });
            });
          } catch {/* skip */}
        })
      );
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return results;
    },
    enabled: !!excData,
  });

  const complete = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      actionApi.complete(id, { closure_notes: notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-actions'] });
      qc.invalidateQueries({ queryKey: ['exceptions-for-actions'] });
      setClosingId(null);
      setClosureNote('');
      refetch();
    },
  });

  const isLoading = excLoading || actLoading;

  const rows: ActionWithException[] = (actionData || []).filter(a =>
    !filterStatus || a.status === filterStatus
  );

  const stats = {
    open:       (actionData || []).filter(a => a.status === 'open').length,
    inProgress: (actionData || []).filter(a => a.status === 'in_progress').length,
    complete:   (actionData || []).filter(a => a.status === 'complete').length,
    total:      (actionData || []).length,
  };

  return (
    <div>
      <PageHeader
        title="Corrective Actions"
        subtitle="All active and completed corrective actions across exceptions"
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Actions', value: stats.total, color: 'var(--accent)' },
          { label: 'Open',         value: stats.open,   color: 'var(--high)' },
          { label: 'In Progress',  value: stats.inProgress, color: '#8b5cf6' },
          { label: 'Complete',     value: stats.complete,   color: 'var(--low)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: color }} />
            <div>
              <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Filter:</span>
        {['', 'open', 'in_progress', 'pending_review', 'complete', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filterStatus === s ? 'var(--accent)' : 'var(--bg-card)',
              color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Inline close modal */}
      {closingId !== null && (
        <div className="card p-4 mb-4 animate-slide-up border-2"
             style={{ borderColor: 'var(--accent)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Complete Action #{closingId}
          </p>
          <textarea
            className="input-field w-full resize-none mb-3"
            rows={2}
            placeholder="Closure notes (optional)…"
            value={closureNote}
            onChange={e => setClosureNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary text-xs"
              onClick={() => complete.mutate({ id: closingId, notes: closureNote })}
              disabled={complete.isPending}
            >
              {complete.isPending ? <Spinner size={13} /> : <CheckCircle size={13} />}
              Mark Complete
            </button>
            <button className="btn-ghost text-xs" onClick={() => setClosingId(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={36} />}
            title="No corrective actions found"
            desc="Actions are created when exception workflows run."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  {['Ticket ID', 'Title', 'Exception', 'Assigned To', 'Priority', 'Status', 'Due', 'Created', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t transition-colors hover:bg-[var(--bg-card-hover)]"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium" style={{ color: 'var(--accent)' }}>
                          {a.ticket_id || '—'}
                        </span>
                        {a.ticket_url && a.ticket_url !== '#' && (
                          <a href={a.ticket_url} target="_blank" rel="noreferrer"
                             style={{ color: 'var(--text-muted)' }}>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {a.ticket_system}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {a.title}
                      </p>
                      {a.description && (
                        <p className="truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {a.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.exception_ref ? (
                        <Link
                          to={`/exceptions/${a.exception_id}`}
                          className="flex items-center gap-1 font-mono font-medium hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {a.exception_ref} <ChevronRight size={11} />
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>#{a.exception_id}</span>
                      )}
                      {a.exception_severity && (
                        <SeverityBadge
                          label={a.exception_severity}
                          variant={a.exception_severity as any}
                          size="sm"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {a.assigned_to || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge label={a.priority} variant={a.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-base ${ACTION_STATUS_STYLES[a.status] || ''}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.due_date ? (
                        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={11} />
                          {fmtRelative(a.due_date)}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                      {fmtRelative(a.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {a.status !== 'complete' && a.status !== 'cancelled' && (
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
                          style={{ background: 'var(--low-bg)', color: 'var(--low)' }}
                          onClick={() => { setClosingId(a.id); setClosureNote(''); }}
                        >
                          <CheckCircle size={11} /> Done
                        </button>
                      )}
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

export default CorrectiveActionsPage;
