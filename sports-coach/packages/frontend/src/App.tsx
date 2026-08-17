import { Navigate, Route, Routes, Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { DailyLogPage } from "./features/daily-log/DailyLogPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CoachPage } from "./features/coach/CoachPage";
import { TrainingPlanPage } from "./features/training-plan/TrainingPlanPage";
import { StravaCallbackPage } from "./features/dashboard/StravaCallbackPage";
import { BillingPage } from "./features/billing/BillingPage";
import { EbookPage } from "./features/ebook/EbookPage";
import { PrivacyPage } from "./features/legal/PrivacyPage";
import { NutritionPage } from "./features/nutrition/NutritionPage";

const NAV_LINKS = [
  { to: "/", label: "Journal", icon: "📓" },
  { to: "/dashboard", label: "Seances", icon: "🏃" },
  { to: "/plan", label: "Plan", icon: "📅" },
  { to: "/coach", label: "Coach", icon: "🤖" },
  { to: "/nutrition", label: "Nutrition", icon: "🥗", highlight: true },
  { to: "/ebook", label: "Ebook", icon: "📖", highlight: true },
  { to: "/abonnement", label: "Abonnement", icon: "👑", highlight: true },
];

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
        <nav className="glass-card sticky top-0 z-10 flex items-center gap-2 px-2 py-3 shadow-sm shadow-slate-900/5 sm:px-4">
          <span className="hidden shrink-0 pl-2 text-lg font-extrabold tracking-tight text-slate-900 sm:inline">
            👑 Kadence
          </span>
          <div className="flex flex-1 items-center gap-1 overflow-x-auto sm:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-kadence"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                      active
                        ? "text-white"
                        : link.highlight
                          ? "text-pink-600 hover:text-pink-700"
                          : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span aria-hidden>{link.icon}</span>
                    <span className="hidden sm:inline">{link.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => logout()}
            aria-label="Deconnexion"
            className="shrink-0 rounded-full px-2.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:px-3"
          >
            <span aria-hidden className="sm:hidden">
              🚪
            </span>
            <span className="hidden sm:inline">Deconnexion</span>
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
      <Route path="/ebook" element={<EbookPage />} />
      <Route path="/confidentialite" element={<PrivacyPage />} />
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
      <Route
        path="/nutrition"
        element={
          <ProtectedLayout>
            <NutritionPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/plan"
        element={
          <ProtectedLayout>
            <TrainingPlanPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/strava/callback"
        element={
          <ProtectedLayout>
            <StravaCallbackPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/abonnement"
        element={
          <ProtectedLayout>
            <BillingPage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}
