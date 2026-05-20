import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/ui/shared';

// Lazy imports for code splitting
const ExceptionDashboard  = React.lazy(() => import('@/pages/ExceptionDashboard/index'));
const ExceptionsListPage  = React.lazy(() => import('@/pages/ExceptionDashboard/ExceptionsList'));
const ExceptionDetailPage = React.lazy(() => import('@/pages/ExceptionDetail/index'));
const TelemetryPage       = React.lazy(() => import('@/pages/TelemetryPage/index'));
const PlaybooksPage       = React.lazy(() => import('@/pages/PlaybooksPage/index'));
const CorrectiveActionsPage     = React.lazy(() => import('@/pages/CorrectiveActions/index'));
const EscalationTimelinePage    = React.lazy(() => import('@/pages/EscalationTimeline/index'));
const ConversationalOpsPage     = React.lazy(() => import('@/pages/ConversationalOps/index'));
const ReportsPage               = React.lazy(() => import('@/pages/ReportsPage/index'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Spinner size={28} />
  </div>
);

export const AppRouter: React.FC = () => (
  <MainLayout>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"               element={<ExceptionDashboard />} />
        <Route path="/telemetry"      element={<TelemetryPage />} />
        <Route path="/exceptions"     element={<ExceptionsListPage />} />
        <Route path="/exceptions/:id" element={<ExceptionDetailPage />} />
        <Route path="/playbooks"      element={<PlaybooksPage />} />
        <Route path="/actions"        element={<CorrectiveActionsPage />} />
        <Route path="/escalations"    element={<EscalationTimelinePage />} />
        <Route path="/chat"           element={<ConversationalOpsPage />} />
        <Route path="/reports"        element={<ReportsPage />} />
        {/* catch-all */}
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </MainLayout>
);

export default AppRouter;
