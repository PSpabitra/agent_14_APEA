import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telemetryApi, deviationApi } from '@/services/api/client';
import { TelemetryMetric } from '@/types/apea.types';
import { PageHeader, Spinner, EmptyState, fmtDate } from '@/components/ui/shared';
import { Activity, Plus, Zap } from 'lucide-react';

const DEFAULT_FORM = {
  plant_name: '', line_name: '', metric_type: 'run_rate',
  actual_value: '', target_value: '', unit: 'units/hr', source: 'REST',
  recorded_at: new Date().toISOString().slice(0,16)
};

export const TelemetryPage: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [detectResult, setDetectResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['telemetry'],
    queryFn: () => telemetryApi.list({ limit: 50 }).then(r => r.data),
  });

  const ingest = useMutation({
    mutationFn: (d: typeof form) => telemetryApi.ingest({
      ...d,
      actual_value: parseFloat(d.actual_value),
      target_value: parseFloat(d.target_value),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['telemetry'] });
      setShowForm(false);
      setForm(DEFAULT_FORM);
    }
  });

  const detect = useMutation({
    mutationFn: (id: number) => deviationApi.detect({ telemetry_id: id }),
    onSuccess: (r) => setDetectResult(JSON.stringify(r.data, null, 2))
  });

  const rows: TelemetryMetric[] = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Telemetry"
        subtitle="Ingest and view production metrics"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
            <Plus size={15} /> Ingest Metric
          </button>
        }
      />

      {showForm && (
        <div className="card p-5 mb-6 animate-slide-up">
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Ingest Telemetry Record
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { k: 'plant_name', label: 'Plant Name', placeholder: 'Plant A' },
              { k: 'line_name',  label: 'Line Name',  placeholder: 'Line 1' },
              { k: 'unit',       label: 'Unit',       placeholder: 'units/hr' },
            ].map(({ k, label, placeholder }) => (
              <div key={k}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <input className="input-field" placeholder={placeholder}
                       value={(form as Record<string,string>)[k]}
                       onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Metric Type</label>
              <select className="input-field" value={form.metric_type}
                      onChange={e => setForm(f => ({ ...f, metric_type: e.target.value }))}>
                {['run_rate','utilization','throughput','asset_delivery'].map(v =>
                  <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Actual Value</label>
              <input type="number" className="input-field" placeholder="850"
                     value={form.actual_value}
                     onChange={e => setForm(f => ({ ...f, actual_value: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Target Value</label>
              <input type="number" className="input-field" placeholder="1000"
                     value={form.target_value}
                     onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Recorded At</label>
              <input type="datetime-local" className="input-field"
                     value={form.recorded_at}
                     onChange={e => setForm(f => ({ ...f, recorded_at: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button className="btn-primary" onClick={() => ingest.mutate(form)}
                    disabled={ingest.isPending}>
              {ingest.isPending ? <Spinner size={14} /> : <Activity size={14} />}
              Ingest
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          {ingest.isError && (
            <p className="text-xs mt-2" style={{ color: 'var(--critical)' }}>{(ingest.error as Error).message}</p>
          )}
        </div>
      )}

      {detectResult && (
        <div className="card p-4 mb-6 text-xs font-mono" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
          <p className="font-semibold mb-1">Deviation Detection Result:</p>
          <pre className="whitespace-pre-wrap">{detectResult}</pre>
          <button className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}
                  onClick={() => setDetectResult(null)}>Dismiss</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size={24} /></div>
          ) : rows.length === 0 ? (
            <EmptyState icon={<Activity size={36} />} title="No telemetry records"
                        desc="Ingest your first metric to get started." />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  {['ID','Plant','Line','Type','Actual','Target','Gap %','Source','Recorded At','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const gap = r.target_value > 0
                    ? (((r.target_value - r.actual_value) / r.target_value) * 100).toFixed(1)
                    : '0';
                  const gapN = parseFloat(gap);
                  return (
                    <tr key={r.id}
                        className="border-t transition-colors hover:bg-[var(--bg-card-hover)]"
                        style={{ borderColor: 'var(--border-subtle)', animationDelay: `${i * 40}ms` }}>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>{r.id}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{r.plant_name}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.line_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                          {r.metric_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {r.actual_value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {r.target_value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold"
                          style={{ color: gapN >= 15 ? 'var(--critical)' : gapN >= 5 ? 'var(--high)' : 'var(--low)' }}>
                        {gapN > 0 ? `-${gap}%` : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.source}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmtDate(r.recorded_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:opacity-80"
                          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                          onClick={() => detect.mutate(r.id)}
                          disabled={detect.isPending}
                        >
                          <Zap size={11} /> Detect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelemetryPage;
