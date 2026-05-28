import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/api";
import { springSettle, panelSlideRight, modalBackdrop, modalContent } from "@/lib/motion";
import AppShell from "@/components/chrome/AppShell";
import ProjectList from "@/components/infra/ProjectList";
import ProjectDetail from "@/components/infra/ProjectDetail";

export default function InfraPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [localSelected, setLocalSelected] = useState<string | null>(projectId ?? null);
  const selectedId = localSelected;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const selectedProject = projects?.find((p) => p.id === selectedId);

  function handleSelect(id: string) {
    setLocalSelected(id);
    navigate(`/infrastructure/${id}`, { replace: true });
  }

  function handleClose() {
    setLocalSelected(null);
    navigate(`/infrastructure`, { replace: true });
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="h-[calc(100dvh-3.5rem)] p-3 sm:p-5"
      >
        <div className="w-full h-full lg:max-w-[480px] mx-auto lg:mx-0">
          <ProjectList selectedId={selectedId} onSelect={handleSelect} />
        </div>
      </motion.div>

      {/* DESKTOP: slide-in side panel */}
      <AnimatePresence>
        {!isMobile && selectedProject && (
          <motion.div
            key="infra-side-panel"
            className="fixed inset-y-0 right-0 z-30 flex"
            initial={{ pointerEvents: "none" }}
            animate={{ pointerEvents: "auto" }}
            exit={{ pointerEvents: "none" }}
          >
            <motion.aside
              key={selectedProject.id}
              variants={panelSlideRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="w-[440px] xl:w-[480px] glass-strong border-l border-border h-full overflow-y-auto shadow-modal"
              role="complementary"
              aria-label={`${selectedProject.name} details`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 border-b border-border glass-strong">
                <span className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                  Project details
                </span>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                  aria-label="Close panel"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-1">
                <ProjectDetail project={selectedProject} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE: centered popup modal */}
      <AnimatePresence>
        {isMobile && selectedProject && (
          <motion.div
            key="infra-mobile-modal"
            className="fixed inset-0 z-40 flex items-center justify-center p-3 pb-safe"
          >
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              key={selectedProject.id}
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="relative w-full max-w-[460px] max-h-[88vh] glass-strong border border-border rounded-modal overflow-y-auto shadow-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedProject.name} details`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 border-b border-border glass-strong">
                <span className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                  Project details
                </span>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                  aria-label="Close popup"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-1">
                <ProjectDetail project={selectedProject} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
