import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
// Lazy loaded Pages & Layouts
const AppShell = lazy(() => import('./components/AppShell'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const JdUploadAtsPage = lazy(() => import('./pages/JdUploadAtsPage'));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Private Route Guard Component
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? (
    <Suspense fallback={<PageFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Non-blocking background auth initialization for existing sessions
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/students"
            element={
              <PrivateRoute>
                <StudentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <PrivateRoute>
                <StudentProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <PrivateRoute>
                <CompaniesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <PrivateRoute>
                <JobsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <ReportsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/jd-matcher"
            element={
              <PrivateRoute>
                <JdUploadAtsPage />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

