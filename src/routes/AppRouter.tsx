import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./routes.config";
import { PrivateRoute } from "./PrivateRoute";
import { AppShell } from "@/components/layout/AppShell";
import { NotFoundPage } from "@/pages/NotFound";

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-16 text-sm text-subtext">
      Loading…
    </div>
  );
}

export function AppRouter() {
  const publicRoutes = ROUTES.filter((r) => r.public);
  const protectedRoutes = ROUTES.filter((r) => !r.public);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {publicRoutes.map((r) => {
          const C = r.component;
          return <Route key={r.path} path={r.path} element={<C />} />;
        })}

        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          {protectedRoutes.map((r) => {
            const C = r.component;
            const element = r.roles ? (
              <PrivateRoute roles={r.roles}>
                <C />
              </PrivateRoute>
            ) : (
              <C />
            );
            return <Route key={r.path} path={r.path} element={element} />;
          })}
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
