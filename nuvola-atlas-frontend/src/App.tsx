import { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore, hasRoleAtLeast, isInvestor } from "@/stores/auth";
import { lazyWithRetry, markAppLoaded } from "@/lib/lazyWithRetry";
import SignInPage from "@/pages/SignInPage";

// lazyWithRetry survives Vercel deploys that change chunk file hashes —
// see the file for the reload-recovery details.
const SignUpPage = lazyWithRetry(() => import("@/pages/SignUpPage"));
const AtlasPage = lazyWithRetry(() => import("@/pages/AtlasPage"));
const VitalityPage = lazyWithRetry(() => import("@/pages/VitalityPage"));
const ComparePage = lazyWithRetry(() => import("@/pages/ComparePage"));
const InfraPage = lazyWithRetry(() => import("@/pages/InfraPage"));
const ReportsPage = lazyWithRetry(() => import("@/pages/ReportsPage"));
const AlertsPage = lazyWithRetry(() => import("@/pages/AlertsPage"));
const AssistantPage = lazyWithRetry(() => import("@/pages/AssistantPage"));
const SettingsPage = lazyWithRetry(() => import("@/pages/SettingsPage"));
const AdminPage = lazyWithRetry(() => import("@/pages/AdminPage"));
const InvestorPage = lazyWithRetry(() => import("@/pages/InvestorPage"));
const PublicPortalPage = lazyWithRetry(() => import("@/pages/PublicPortalPage"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!hasRoleAtLeast(user, "admin")) return <Navigate to="/atlas" replace />;
  return <>{children}</>;
}

function RequireInvestor({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/sign-in" replace />;
  // Investors + admin both get through — admins can view the investor
  // dashboard for support / demo purposes.
  if (!isInvestor(user) && !hasRoleAtLeast(user, "admin")) {
    return <Navigate to="/atlas" replace />;
  }
  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
      />
    </div>
  );
}

export default function App() {
  const location = useLocation();

  // Once the app renders successfully, clear the "already tried a reload"
  // guard so a genuinely stale chunk after the *next* deploy is allowed
  // to trigger another self-heal reload.
  useEffect(() => {
    markAppLoaded();
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/public" element={<PublicPortalPage />} />
        <Route path="/atlas" element={<RequireAuth><AtlasPage /></RequireAuth>} />
        <Route path="/vitality" element={<RequireAuth><VitalityPage /></RequireAuth>} />
        <Route path="/compare" element={<RequireAuth><ComparePage /></RequireAuth>} />
        <Route path="/infrastructure/:projectId?" element={<RequireAuth><InfraPage /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
        <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
        <Route path="/assistant" element={<RequireAuth><AssistantPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/investor" element={<RequireInvestor><InvestorPage /></RequireInvestor>} />
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/atlas" replace />} />
      </Routes>
    </Suspense>
  );
}
