import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api";
import AppShell from "@/components/chrome/AppShell";
import DetailPopup from "@/components/common/DetailPopup";
import ProjectList from "@/components/infra/ProjectList";
import ProjectDetail from "@/components/infra/ProjectDetail";
import { useT } from "@/lib/i18n/use-t";

export default function InfraPage() {
  const t = useT();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [localSelected, setLocalSelected] = useState<string | null>(projectId ?? null);

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const selectedProject = projects?.find((p) => p.id === localSelected);

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
        className="h-[calc(100dvh-3.5rem-var(--mobile-nav-h))] p-3 sm:p-5"
      >
        <div className="w-full h-full lg:max-w-[480px] mx-auto lg:mx-0">
          <ProjectList selectedId={localSelected} onSelect={handleSelect} />
        </div>
      </motion.div>

      <DetailPopup
        open={!!selectedProject}
        onClose={handleClose}
        label={t("infra.detail.detailsLabel")}
        ariaLabel={
          selectedProject
            ? t("infra.detail.detailsAria", { name: selectedProject.name })
            : t("infra.detail.detailsLabel")
        }
      >
        {selectedProject && <ProjectDetail project={selectedProject} />}
      </DetailPopup>
    </AppShell>
  );
}
