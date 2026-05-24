import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/api";
import { springSettle } from "@/lib/motion";
import AppShell from "@/components/chrome/AppShell";
import ProjectList from "@/components/infra/ProjectList";
import ProjectDetail from "@/components/infra/ProjectDetail";

export default function InfraPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const selectedId = projectId ?? localSelected;

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const selectedProject = projects?.find((p) => p.id === selectedId);

  function handleSelect(id: string) {
    setLocalSelected(id);
    navigate(`/infrastructure/${id}`, { replace: true });
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] p-4 sm:p-5 gap-4"
      >
        <div className="w-full lg:w-[340px] shrink-0 overflow-y-auto lg:h-full">
          <ProjectList selectedId={selectedId} onSelect={handleSelect} />
        </div>
        <div className="flex-1 min-w-0 min-h-[300px] lg:min-h-0">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <ProjectDetail key={selectedProject.id} project={selectedProject} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-strong rounded-card h-full flex items-center justify-center"
              >
                <p className="text-[13px] text-ink-4">Select a project to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AppShell>
  );
}
