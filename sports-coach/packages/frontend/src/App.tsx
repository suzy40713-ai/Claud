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
import { RecettesRegimePage } from "./features/ebook/RecettesRegimePage";
import { RecettesPriseDeMassePage } from "./features/ebook/RecettesPriseDeMassePage";
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
    <div className="flex h-dvh flex-col">
      {user.onboardingComplete && (
        <nav className="glass-card z-20 flex shrink-0 items-center justify-between gap-2 px-3 py-3 shadow-sm shadow-slate-900/5 sm:px-4">
          <span className="flex shrink-0 items-center gap-1.5 text-lg font-extrabold tracking-tight text-slate-900">
            <span aria-hidden className="text-xl leading-none">
              👑
            </span>
            <span className="hidden sm:inline">Cadenzo</span>
          </span>
          <div className="hidden flex-1 items-center gap-1 sm:flex sm:gap-2">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.to} link={link} active={location.pathname === link.to} />
            ))}
          </div>
          <button
            onClick={() => logout()}
            aria-label="Deconnexion"
            className="shrink-0 rounded-full px-2.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:px-3"
          >
            <span aria-hidden className="text-lg sm:hidden">
              🚪
            </span>
            <span className="hidden sm:inline">Deconnexion</span>
          </button>
        </nav>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {user.onboardingComplete && (
        <div className="glass-card z-20 flex shrink-0 items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] sm:hidden">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.to} link={link} active={location.pathname === link.to} mobileTab />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({
  link,
  active,
  mobileTab,
}: {
  link: (typeof NAV_LINKS)[number];
  active: boolean;
  mobileTab?: boolean;
}) {
  return (
    <Link
      to={link.to}
      className={
        mobileTab
          ? "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold"
          : "relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold"
      }
    >
      {active && (
        <motion.span
          layoutId={mobileTab ? "nav-active-pill-mobile" : "nav-active-pill"}
          className={
            mobileTab
              ? "absolute inset-x-2 top-0.5 h-8 rounded-xl bg-gradient-kadence-soft"
              : "absolute inset-0 rounded-full bg-gradient-kadence"
          }
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span
        className={`relative z-10 flex ${mobileTab ? "flex-col items-center gap-0.5" : "items-center gap-1.5"} transition-colors ${
          active
            ? mobileTab
              ? "text-indigo-600"
              : "text-white"
            : link.highlight
              ? "text-pink-600 hover:text-pink-700"
              : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <span aria-hidden className={mobileTab ? "text-xl leading-none" : "text-base leading-none"}>
          {link.icon}
        </span>
        <span className={mobileTab ? "leading-none" : "hidden sm:inline"}>{link.label}</span>
        {link.highlight && !active && (
          <span
            aria-hidden
            className={mobileTab ? "absolute right-1 top-0 h-1.5 w-1.5 rounded-full bg-pink-500" : "h-1.5 w-1.5 rounded-full bg-pink-500"}
          />
        )}
      </span>
    </Link>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/ebook" element={<EbookPage />} />
      <Route path="/recettes-regime" element={<RecettesRegimePage />} />
      <Route path="/recettes-prise-de-masse" element={<RecettesPriseDeMassePage />} />
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
