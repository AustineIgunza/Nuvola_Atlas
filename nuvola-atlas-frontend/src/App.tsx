import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import SignInPage from "@/pages/SignInPage";

const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const VitalityPage = lazy(() => import("@/pages/VitalityPage"));
const InfraPage = lazy(() => import("@/pages/InfraPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const AlertsPage = lazy(() => import("@/pages/AlertsPage"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/sign-in" replace />;
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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/atlas" element={<RequireAuth><AtlasPage /></RequireAuth>} />
          <Route path="/vitality" element={<RequireAuth><VitalityPage /></RequireAuth>} />
          <Route path="/infrastructure/:projectId?" element={<RequireAuth><InfraPage /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
          <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/atlas" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
