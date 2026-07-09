import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore, hasRoleAtLeast } from "@/stores/auth";
import SignInPage from "@/pages/SignInPage";

const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const VitalityPage = lazy(() => import("@/pages/VitalityPage"));
const ComparePage = lazy(() => import("@/pages/ComparePage"));
const InfraPage = lazy(() => import("@/pages/InfraPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const AlertsPage = lazy(() => import("@/pages/AlertsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

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

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/atlas" element={<RequireAuth><AtlasPage /></RequireAuth>} />
        <Route path="/vitality" element={<RequireAuth><VitalityPage /></RequireAuth>} />
        <Route path="/compare" element={<RequireAuth><ComparePage /></RequireAuth>} />
        <Route path="/infrastructure/:projectId?" element={<RequireAuth><InfraPage /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
        <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/atlas" replace />} />
      </Routes>
    </Suspense>
  );
}
