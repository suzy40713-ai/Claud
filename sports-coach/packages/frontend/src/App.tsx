import { Navigate, Route, Routes, Link, useLocation } from "react-router";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { DailyLogPage } from "./features/daily-log/DailyLogPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CoachPage } from "./features/coach/CoachPage";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen">
      {user.onboardingComplete && (
        <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex gap-4 text-sm font-medium text-slate-600">
            <Link to="/">Journal</Link>
            <Link to="/dashboard">Seances</Link>
            <Link to="/coach">Coach</Link>
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-400 hover:text-slate-600">
            Deconnexion
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedLayout>
            <OnboardingPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <DailyLogPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/coach"
        element={
          <ProtectedLayout>
            <CoachPage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}
