import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

export type AdminTab =
  | "overview"
  | "audit"
  | "users"
  | "api-keys"
  | "firms"
  | "data"
  | "methodology"
  | "announcements"
  | "health"
  | "content";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "health", label: "System health" },
  { id: "audit", label: "Audit log" },
  { id: "users", label: "Users" },
  { id: "firms", label: "Firms" },
  { id: "data", label: "Data feeds" },
  { id: "methodology", label: "Methodology" },
  { id: "content", label: "Content" },
  { id: "announcements", label: "Announcements" },
  { id: "api-keys", label: "API keys" },
];

interface Props {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export default function AdminTabs({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative px-3 sm:px-4 h-10 text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0",
              isActive ? "text-ink-1" : "text-ink-3 hover:text-ink-2",
            )}
            aria-pressed={isActive}
          >
            {t.label}
            {isActive && (
              <motion.div
                layoutId="admin-tab-underline"
                className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
