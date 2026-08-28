import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useUIStore } from "@/shared/stores/ui";
import DetailPopup from "@/shared/ui/DetailPopup";
import ProjectDetail from "@/components/infra/ProjectDetail";

export default function ProjectQuickView() {
  const projectId = useUIStore((s) => s.quickViewProjectId);
  const close = useUIStore((s) => s.closeQuickView);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: !!projectId,
  });
  const project = projects?.find((p) => p.id === projectId);

  return (
    <DetailPopup
      open={!!project}
      onClose={close}
      label="Project details"
      ariaLabel={project ? `${project.name} details` : "Project details"}
    >
      {project && <ProjectDetail project={project} />}
    </DetailPopup>
  );
}
