import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

const api = apiClient;

// ── Telemetry ──────────────────────────────────────────────────
export const telemetryApi = {
  ingest:  (data: unknown)  => api.post('/telemetry/ingest', data),
  list:    (params?: object) => api.get('/telemetry', { params }),
};

// ── Deviations ─────────────────────────────────────────────────
export const deviationApi = {
  detect: (data: unknown)  => api.post('/deviations/detect', data),
  list:   (params?: object) => api.get('/deviations', { params }),
};

// ── Exceptions ─────────────────────────────────────────────────
export const exceptionApi = {
  create:    (data: unknown)               => api.post('/exceptions/create', data),
  list:      (params?: object)             => api.get('/exceptions', { params }),
  getById:   (id: number)                  => api.get(`/exceptions/${id}`),
  setStatus: (id: number, data: unknown)   => api.patch(`/exceptions/${id}/status`, data),
};

// ── Workflow ───────────────────────────────────────────────────
export const workflowApi = {
  run:       (data: unknown) => api.post('/agents/run-exception-workflow', data),
  getStatus: (id: number)    => api.get(`/agents/workflow-status/${id}`),
};

// ── RCA ────────────────────────────────────────────────────────
export const rcaApi = {
  analyze: (id: number, data?: unknown) => api.post(`/rca/analyze/${id}`, data || {}),
  get:     (id: number)                 => api.get(`/rca/${id}`),
};

// ── Corrective Actions ─────────────────────────────────────────
export const actionApi = {
  create:   (excId: number, data: unknown) => api.post(`/corrective-actions/create/${excId}`, data),
  complete: (id: number, data?: unknown)   => api.patch(`/corrective-actions/${id}/complete`, data || {}),
};

// ── Escalations ────────────────────────────────────────────────
export const escalationApi = {
  evaluate: (id: number)              => api.post(`/escalations/evaluate/${id}`),
  notify:   (id: number, data: unknown) => api.post(`/escalations/notify/${id}`, data),
};

// ── Playbooks ──────────────────────────────────────────────────
export const playbookApi = {
  upload: (data: unknown)  => api.post('/playbooks/upload', data),
  list:   (params?: object) => api.get('/playbooks', { params }),
};

// ── Chat ───────────────────────────────────────────────────────
export const chatApi = {
  query: (data: { query: string; history: unknown[] }) => api.post('/chat/query', data),
};

// ── Reports ────────────────────────────────────────────────────
export const reportApi = {
  generate: (id: number) => api.post(`/reports/generate/${id}`),
  download: (id: number) => api.get(`/reports/download/${id}`, { responseType: 'blob' }),
};

// ── Dashboard ──────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};
