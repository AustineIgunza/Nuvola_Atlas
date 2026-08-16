import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Shield, ExternalLink, Calendar, MapPin } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { formatRelative, formatDate } from "@/lib/format";
import { springSettle } from "@/lib/motion";
import { useT } from "@/lib/i18n/use-t";
import { SEVERITY_COLORS, IMPACT_STYLES, KIND_LABEL_KEYS } from "./alerts.constants";
import type { AlertItem } from "@/types";

interface Props {
  alert: AlertItem;
  zoneName: string;
  projectName: (id: string) => string;
}

export default function AlertDetail({ alert: a, zoneName, projectName }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const openQuickView = useUIStore((s) => s.openQuickView);
  const impact = IMPACT_STYLES[a.impactLevel] ?? IMPACT_STYLES.moderate;
  const sevColor = SEVERITY_COLORS[a.severity];
  const severityLabel = t(
    a.severity === "high"
      ? "alerts.severity.high"
      : a.severity === "medium"
        ? "alerts.severity.medium"
        : "alerts.severity.low",
  );
  const kindKey = KIND_LABEL_KEYS[a.kind];

  return (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSettle}
      className="p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
          style={{
            background: sevColor,
            boxShadow: `0 0 10px ${sevColor}55, 0 0 4px ${sevColor}30`,
          }}
        >
          {severityLabel}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: impact.bg, color: impact.text }}
        >
          {t(impact.labelKey)}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(255,255,255,0.06)] text-ink-3">
          {kindKey ? t(kindKey) : a.kind}
        </span>
      </div>

      <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-ink-1 mb-1.5">
        {a.title}
      </h2>

      <div className="flex items-center gap-3 text-[12px] text-ink-4 mb-5 flex-wrap">
        {a.zoneId ? (
          <button
            onClick={() => navigate(`/atlas?zone=${a.zoneId}`)}
            className="flex items-center gap-1 text-ink-3 hover:text-accent transition-colors"
          >
            <MapPin size={12} />
            {zoneName}
          </button>
        ) : (
          <span>{zoneName}</span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(a.createdAt)} &middot; {formatRelative(a.createdAt)}
        </span>
      </div>

      <p className="text-[13px] text-ink-2 leading-[1.6] mb-6">{a.body}</p>

      {a.affectedInfra.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <h3 className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-ink-4" />
            {t("alert.affectedInfra")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {a.affectedInfra.map((infra, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(255,255,255,0.05)] text-ink-2 border border-border/40"
              >
                {infra}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {a.recommendedActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <h3 className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5">
            <Shield size={12} className="text-ink-4" />
            {t("alert.recommendedActions")}
          </h3>
          <div className="space-y-1.5">
            {a.recommendedActions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.03 }}
                className="flex items-start gap-2 text-[12.5px] text-ink-2"
              >
                <span className="text-accent mt-0.5 shrink-0 text-[10px]">●</span>
                <span className="leading-[1.5]">{action}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {a.relatedProjectIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5">
            <ExternalLink size={12} className="text-ink-4" />
            {t("alert.relatedProjects")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {a.relatedProjectIds.map((pid) => (
              <button
                key={pid}
                onClick={() => openQuickView(pid)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors btn-press"
              >
                {projectName(pid)}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
