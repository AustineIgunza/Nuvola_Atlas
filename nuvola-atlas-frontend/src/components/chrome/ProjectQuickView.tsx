import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/api";
import { useUIStore } from "@/stores/ui";
import { springSettle, panelSlideRight, modalBackdrop, modalContent } from "@/lib/motion";
import ProjectDetail from "@/components/infra/ProjectDetail";

export default function ProjectQuickView() {
  const projectId = useUIStore((s) => s.quickViewProjectId);
  const close = useUIStore((s) => s.closeQuickView);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: !!projectId,
  });
  const project = projects?.find((p) => p.id === projectId);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [projectId, close]);

  return (
    <>
      {/* DESKTOP: slide-in side panel */}
      <AnimatePresence>
        {!isMobile && project && (
          <motion.div
            key="qv-side-panel"
            className="fixed inset-y-0 right-0 z-40 flex"
            initial={{ pointerEvents: "none" }}
            animate={{ pointerEvents: "auto" }}
            exit={{ pointerEvents: "none" }}
          >
            <motion.aside
              key={project.id}
              variants={panelSlideRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="w-[440px] xl:w-[480px] glass-strong border-l border-border h-full overflow-y-auto shadow-modal"
              role="complementary"
              aria-label={`${project.name} details`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 border-b border-border glass-strong">
                <span className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                  Project details
                </span>
                <button
                  onClick={close}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                  aria-label="Close panel"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-1">
                <ProjectDetail project={project} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE: centered popup modal */}
      <AnimatePresence>
        {isMobile && project && (
          <motion.div
            key="qv-mobile-modal"
            className="fixed inset-0 z-40 flex items-center justify-center p-3 pb-safe"
          >
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              key={project.id}
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="relative w-full max-w-[460px] max-h-[88vh] glass-strong border border-border rounded-modal overflow-y-auto shadow-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${project.name} details`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 border-b border-border glass-strong">
                <span className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                  Project details
                </span>
                <button
                  onClick={close}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                  aria-label="Close popup"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-1">
                <ProjectDetail project={project} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
