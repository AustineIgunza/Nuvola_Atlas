import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { springSettle } from "@/lib/motion";
import ProjectCard from "./ProjectCard";
import type { InfraType } from "@/types";

const FILTERS: { label: string; value: InfraType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Road", value: "road" },
  { label: "Energy", value: "energy" },
  { label: "Grid", value: "grid" },
];

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ProjectList({ selectedId, onSelect }: Props) {
  const [typeFilter, setTypeFilter] = useState<InfraType | "all">("all");

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  const filtered = projects?.filter((p) => typeFilter === "all" || p.type === typeFilter) ?? [];

  function zoneName(id: string) { return zones?.find((z) => z.id === id)?.name ?? id; }

  return (
    <div className="glass-strong rounded-card p-4 h-full overflow-y-auto">
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap relative">
        {FILTERS.map((f) => (
          <motion.button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            whileTap={{ scale: 0.93 }}
            className={cn(
              "relative px-3.5 h-8 rounded-chip text-[11px] font-medium transition-colors",
              typeFilter === f.value ? "text-white" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {typeFilter === f.value && (
              <motion.div
                layoutId="infra-filter"
                className="absolute inset-0 bg-accent rounded-chip glow-accent"
                transition={springSettle}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="space-y-2.5">
        <AnimatePresence mode="sync">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ProjectCard
                project={p}
                selected={p.id === selectedId}
                zoneName={zoneName(p.zoneId)}
                onClick={() => onSelect(p.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
