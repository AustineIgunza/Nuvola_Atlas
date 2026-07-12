import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, ShieldAlert, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { announcementsApi, visibleAnnouncements, type Announcement } from "@/api/announcements";
import { useT } from "@/lib/i18n/use-t";

/**
 * Global announcements strip. Shows above the main content on every route
 * once a user is signed in. Auto-updates as announcements are added or
 * dismissed elsewhere (e.g., in an admin surface).
 */
export default function AnnouncementsBanner() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const [visible, setVisible] = useState<Announcement[]>([]);

  useEffect(() => {
    const refresh = () => setVisible(visibleAnnouncements(user));
    refresh();
    // Refresh when tab regains focus (someone might have dismissed elsewhere)
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [user]);

  if (!user || visible.length === 0) return null;

  const dismiss = (id: string) => {
    announcementsApi.dismiss(id);
    setVisible((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed top-3 right-3 z-40 max-w-[400px] w-[calc(100vw-24px)] sm:w-auto space-y-2 pointer-events-none">
      <AnimatePresence>
        {visible.slice(0, 2).map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="pointer-events-auto rounded-card border shadow-modal p-3 backdrop-blur-md glass-strong"
            style={{ borderColor: severityBorder(a.severity), background: severityBackground(a.severity) }}
          >
            <div className="flex items-start gap-2">
              <SeverityIcon severity={a.severity} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-ink-1">{a.title}</div>
                <div className="text-[10.5px] text-ink-3 mt-0.5 leading-relaxed">{a.body}</div>
              </div>
              {a.dismissible && (
                <button
                  onClick={() => dismiss(a.id)}
                  aria-label={t("announce.dismiss")}
                  className="text-ink-4 hover:text-ink-2 shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: Announcement["severity"] }) {
  if (severity === "critical") return <ShieldAlert size={13} className="shrink-0" style={{ color: "#D3402E" }} />;
  if (severity === "warning") return <AlertTriangle size={13} className="shrink-0" style={{ color: "#E0A82E" }} />;
  return <Info size={13} className="shrink-0" style={{ color: "#1F8A78" }} />;
}

function severityBorder(severity: Announcement["severity"]) {
  if (severity === "critical") return "rgba(211,64,46,0.35)";
  if (severity === "warning") return "rgba(224,168,46,0.35)";
  return "rgba(31,138,120,0.35)";
}

function severityBackground(severity: Announcement["severity"]) {
  if (severity === "critical") return "rgba(211,64,46,0.08)";
  if (severity === "warning") return "rgba(224,168,46,0.08)";
  return "rgba(31,138,120,0.08)";
}
