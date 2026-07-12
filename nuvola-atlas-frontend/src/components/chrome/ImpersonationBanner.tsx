import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, LogOut } from "lucide-react";
import { useImpersonationStore } from "@/stores/impersonation";
import { useAuthStore, type AuthRole } from "@/stores/auth";
import { useT } from "@/lib/i18n/use-t";

/**
 * Persistent strip at the top of the app when the admin is impersonating
 * a user. One tap ends the session and restores the admin's role. The
 * banner is fixed-positioned so it sits above every route without
 * needing route-by-route wiring.
 */
export default function ImpersonationBanner() {
  const record = useImpersonationStore((s) => s.active);
  const end = useImpersonationStore((s) => s.end);
  const authSignIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();
  const t = useT();

  if (!record) return null;

  const stop = () => {
    // Restore the original admin identity. In mock mode we hardcode role
    // to "admin" — when the backend Phase E middleware lands the end
    // route will return the admin's original AuthUser payload.
    authSignIn(
      {
        name: record.adminEmail.split("@")[0],
        email: record.adminEmail,
        role: "admin" as AuthRole,
        email_verified: true,
      },
      "admin-token",
    );
    end();
    navigate("/admin");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 inset-x-0 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-[rgba(192,85,43,0.14)] border-b border-[rgba(192,85,43,0.35)] backdrop-blur-sm"
    >
      <Eye size={12} className="shrink-0 text-accent" />
      <div className="flex-1 min-w-0 text-[11px] sm:text-[12px] text-ink-1">
        <span className="font-semibold">
          {t("impersonate.active", { name: record.target.name })}
        </span>
        <span className="hidden sm:inline text-ink-3"> · {record.reason}</span>
      </div>
      <button
        onClick={stop}
        className="inline-flex items-center gap-1 shrink-0 px-2.5 h-7 rounded-control bg-accent text-white text-[10.5px] font-semibold hover:brightness-110 transition-all"
      >
        <LogOut size={11} />
        <span className="hidden sm:inline">{t("impersonate.end")}</span>
        <span className="sm:hidden">{t("common.close")}</span>
      </button>
    </motion.div>
  );
}
