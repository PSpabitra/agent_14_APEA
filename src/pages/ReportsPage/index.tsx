import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exceptionApi, reportApi } from '@/services/api/client';
import { ExceptionCase } from '@/types/apea.types';
import { PageHeader, SeverityBadge, StatusBadge, Spinner, EmptyState, fmtDate } from '@/components/ui/shared';
import { FileText, Download, Play, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportRecord {
  id: number;
  exception_id: number;
  exception_ref: string;
  report_ref: string;
  title: string;
  file_size_kb: number;
  generated_at: string;
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: excData, isLoading } = useQuery({
    queryKey: ['exceptions-for-reports'],
    queryFn: () => exceptionApi.list({ limit: 100 }).then(r => r.data),
  });

  const generate = useMutation({
    mutationFn: (excId: number) => reportApi.generate(excId),
    onMutate: (id) => {
      setGeneratingId(id);
      setSuccessMsg('');
      setErrorMsg('');
    },
    onSuccess: (resp, excId) => {
      const d = resp.data;
      const exc = exceptions.find(e => e.id === excId);
      setReports(prev => [{
        id: d.report_id,
        exception_id: excId,
        exception_ref: exc?.exception_ref || `#${excId}`,
        report_ref: d.report_ref,
        title: `Exception Report — ${exc?.exception_ref || excId}`,
        file_size_kb: d.size_kb,
        generated_at: new Date().toISOString(),
      }, ...prev]);
      setSuccessMsg(`✓ Report ${d.report_ref} generated (${d.size_kb} KB)`);
      setGeneratingId(null);
    },
    onError: (err) => {
      setErrorMsg((err as Error).message);
      setGeneratingId(null);
    },
  });

  const download = async (reportId: number, reportRef: string) => {
    try {
      const resp = await reportApi.download(reportId);
      const url  = URL.createObjectURL(new Blob([resp.data]));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${reportRef}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Download failed — file may not exist on server disk.');
    }
  };

  const exceptions: ExceptionCase[] = excData?.data || [];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and download exception analysis reports"
      />

      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 animate-slide-up"
             style={{ background: 'var(--low-bg)', color: 'var(--low)' }}>
          <CheckCircle size={15} />
          <span className="text-sm">{successMsg}</span>
          <button className="ml-auto" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 animate-slide-up"
             style={{ background: 'var(--critical-bg)', color: 'var(--critical)' }}>
          <AlertTriangle size={15} />
          <span className="text-sm">{errorMsg}</span>
          <button className="ml-auto" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate panel */}
        <div>
          <h2 className="font-display font-semibold text-sm mb-3"
              style={{ color: 'var(--text-primary)' }}>
            Generate Report
          </h2>
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12"><Spinner size={24} /></div>
            ) : exceptions.length === 0 ? (
              <EmptyState icon={<FileText size={32} />} title="No exceptions found" />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {exceptions.slice(0, 20).map((exc) => (
                  <div key={exc.id}
                       className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-medium"
                              style={{ color: 'var(--accent)' }}>
                          {exc.exception_ref}
                        </span>
                        <SeverityBadge label={exc.severity} variant={exc.severity} size="sm" />
                        <StatusBadge status={exc.status} />
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {exc.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {exc.plant_name} / {exc.line_name} · Risk: {exc.risk_score.toFixed(0)}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                      style={{
                        background: generatingId === exc.id ? 'var(--bg-secondary)' : 'var(--accent-muted)',
                        color: 'var(--accent)',
                      }}
                      onClick={() => generate.mutate(exc.id)}
                      disabled={generatingId !== null}
                    >
                      {generatingId === exc.id
                        ? <><Spinner size={12} /> Generating…</>
                        : <><Play size={12} /> Generate</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generated reports panel */}
        <div>
          <h2 className="font-display font-semibold text-sm mb-3"
              style={{ color: 'var(--text-primary)' }}>
            Generated Reports
          </h2>
          <div className="card overflow-hidden">
            {reports.length === 0 ? (
              <EmptyState
                icon={<FileText size={32} />}
                title="No reports yet"
                desc="Generate a report from an exception to see it here."
              />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {reports.map((r) => (
                  <div key={r.id}
                       className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: 'var(--accent-muted)' }}>
                      <FileText size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-mono"
                         style={{ color: 'var(--text-primary)' }}>
                        {r.report_ref}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {r.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {r.file_size_kb} KB · {fmtDate(r.generated_at)}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all hover:opacity-80"
                      style={{ background: 'var(--low-bg)', color: 'var(--low)' }}
                      onClick={() => download(r.id, r.report_ref)}
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="card p-4 mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Report Contents
            </p>
            {[
              'Executive Summary — severity, risk score, SLA status',
              'Root Cause Analysis — ranked hypotheses with confidence',
              'Corrective Actions — ticket IDs, assignments, status',
              'Escalation History — level, channels, timeline',
              'Audit Trail — complete change log',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold flex-shrink-0"
                      style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item}</span>
              </div>
            ))}
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Format: .docx (Microsoft Word) via python-docx
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
