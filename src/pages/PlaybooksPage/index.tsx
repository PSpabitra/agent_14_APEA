import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playbookApi } from '@/services/api/client';
import { Playbook, PlaybookStep } from '@/types/apea.types';
import { PageHeader, SeverityBadge, Spinner, EmptyState } from '@/components/ui/shared';
import { BookOpen, Plus, ChevronDown, ChevronUp, Tag } from 'lucide-react';

export const PlaybooksPage: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'run_rate', severity_target: 'all',
    plant_name: '', line_name: '', tags: '',
    steps: [{ step: 1, action: '', owner: '' }]
  });

  const { data, isLoading } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => playbookApi.list().then(r => r.data),
  });

  const upload = useMutation({
    mutationFn: () => playbookApi.upload(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['playbooks'] }); setShowForm(false); }
  });

  const addStep = () => setForm(f => ({
    ...f, steps: [...f.steps, { step: f.steps.length + 1, action: '', owner: '' }]
  }));

  const playbooks: Playbook[] = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Playbooks"
        subtitle="Corrective action playbooks and SOPs"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
            <Plus size={15} /> New Playbook
          </button>
        }
      />

      {showForm && (
        <div className="card p-5 mb-6 animate-slide-up">
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Create Playbook
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Name *</label>
              <input className="input-field" placeholder="Playbook name…"
                     value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Category</label>
              <select className="input-field" value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['run_rate','sla','equipment','staffing','general'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Severity Target</label>
              <select className="input-field" value={form.severity_target}
                      onChange={e => setForm(f => ({ ...f, severity_target: e.target.value }))}>
                {['all','low','medium','high','critical'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Tags (comma-separated)</label>
              <input className="input-field" placeholder="tag1,tag2"
                     value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Steps</label>
              <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={addStep}>+ Add step</button>
            </div>
            <div className="space-y-2">
              {form.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono w-6 text-center flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}>{step.step}</span>
                  <input className="input-field flex-1" placeholder="Action description…"
                         value={step.action}
                         onChange={e => setForm(f => ({
                           ...f, steps: f.steps.map((s,j) => j===i ? {...s, action: e.target.value} : s)
                         }))} />
                  <input className="input-field w-32" placeholder="Owner"
                         value={step.owner}
                         onChange={e => setForm(f => ({
                           ...f, steps: f.steps.map((s,j) => j===i ? {...s, owner: e.target.value} : s)
                         }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => upload.mutate()} disabled={!form.name || upload.isPending}>
              {upload.isPending ? <Spinner size={14} /> : <BookOpen size={14} />} Save Playbook
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : playbooks.length === 0 ? (
        <EmptyState icon={<BookOpen size={36} />} title="No playbooks"
                    desc="Create your first playbook to drive corrective actions." />
      ) : (
        <div className="space-y-3">
          {playbooks.map(pb => {
            const steps: PlaybookStep[] = Array.isArray(pb.steps)
              ? pb.steps
              : (typeof pb.steps === 'string' ? JSON.parse(pb.steps) : []);
            const isExpanded = expanded === pb.id;

            return (
              <div key={pb.id} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4"
                  style={{ background: 'transparent' }}
                  onClick={() => setExpanded(isExpanded ? null : pb.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0"
                         style={{ background: 'var(--accent-muted)' }}>
                      <BookOpen size={15} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="text-left">
                      <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {pb.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-md"
                              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {pb.category}
                        </span>
                        {pb.severity_target !== 'all' && (
                          <SeverityBadge label={pb.severity_target} variant={pb.severity_target as any} size="sm" />
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v{pb.version} · {steps.length} steps</span>
                        {pb.tags && pb.tags.split(',').slice(0,3).map(t => (
                          <span key={t} className="inline-flex items-center gap-1 text-xs"
                                style={{ color: 'var(--text-muted)' }}>
                            <Tag size={10} />{t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                               : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>

                {isExpanded && (
                  <div className="border-t px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="space-y-2">
                      {steps.map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                               style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                            {s.step || i+1}
                          </div>
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.action}</p>
                            {s.owner && (
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owner: {s.owner}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlaybooksPage;
