import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ExternalLink, Wrench } from "lucide-react";
import { api } from "@/api";
import { BRAND } from "@/shared/lib/scoreColor";
import { formatRelative } from "@/shared/lib/format";
import { Section, Chip, SEVERITY_COLOR, IMPACT_COLOR, STATUS_STYLE, LayerHintButton } from "./bits";
import type { PanelView } from "./panel-types";
import type { AlertKind } from "@/domain/types";

const KIND_LABEL: Record<AlertKind, string> = {
  infra: "Infrastructure",
  vitality: "Vitality",
  esia: "ESIA",
  system: "System",
  partner: "Partner",
};

interface Props {
  alertId: string;
  onNavigate: (view: PanelView) => void;
}

export default function AlertExplainer({ alertId, onNavigate }: Props) {
  const navigate = useNavigate();
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });

  const a = alerts?.find((x) => x.id === alertId);
  if (!a) {
    return (
      <Section>
        <p className="text-[10.5px] text-ink-4">Alert not found — it may have been resolved.</p>
      </Section>
    );
  }

  const sev = SEVERITY_COLOR[a.severity];
  const imp = IMPACT_COLOR[a.impactLevel];
  const relatedProjects = (projects ?? []).filter((p) => a.relatedProjectIds.includes(p.id));

  return (
    <div className="space-y-3">
      {/* Identity */}
      <Section>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip color={sev}>{a.severity} severity</Chip>
          <Chip color={imp}>{a.impactLevel} impact</Chip>
          <Chip color={BRAND.steel}>{KIND_LABEL[a.kind]}</Chip>
        </div>
        <h3 className="mt-2 text-[13px] font-semibold text-ink-1 leading-snug">{a.title}</h3>
        <div className="mt-1 text-[9.5px] text-ink-4">Raised {formatRelative(a.createdAt)}</div>
        <p className="mt-2 text-[11px] text-ink-2 leading-[1.6]">{a.body}</p>
      </Section>

      {/* What it touches */}
      {a.affectedInfra.length > 0 && (
        <Section title="Affected infrastructure">
          <div className="flex flex-wrap gap-1.5">
            {a.affectedInfra.map((item) => (
              <span
                key={item}
                className="text-[9.5px] font-medium px-2 py-1 rounded-control border text-ink-2"
                style={{ background: `${sev}0D`, borderColor: `${sev}33` }}
              >
                {item}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* What to do about it */}
      {a.recommendedActions.length > 0 && (
        <Section title="Recommended actions">
          <div className="space-y-1.5">
            {a.recommendedActions.map((action, i) => (
              <div
                key={action}
                className="flex items-start gap-2 rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2"
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold shrink-0 mt-[1px]"
                  style={{ background: `${BRAND.gold}1F`, color: BRAND.gold }}
                >
                  {i + 1}
                </span>
                <p className="flex-1 text-[10.5px] text-ink-2 leading-[1.5]">{action}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Linked projects */}
      {relatedProjects.length > 0 && (
        <Section title={`Related projects · ${relatedProjects.length}`}>
          <div className="space-y-1.5">
            {relatedProjects.map((p) => {
              const st = STATUS_STYLE[p.status];
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate({ type: "project", id: p.id })}
                  className="group w-full flex items-center gap-2 text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  <Wrench size={12} className="shrink-0 text-ink-4" />
                  <div className="flex-1 min-w-0 text-[10.5px] font-medium text-ink-1 truncate">
                    {p.name}
                  </div>
                  <Chip color={st.color}>{st.label}</Chip>
                  <span className="text-[10.5px] font-semibold tabular-nums shrink-0 text-ink-3">
                    {p.progress}%
                  </span>
                  <ChevronRight
                    size={12}
                    className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
                  />
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <button
        onClick={() => navigate("/alerts")}
        className="w-full h-8 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-[10.5px] font-medium text-ink-3 hover:bg-[rgba(255,255,255,0.08)] transition-colors flex items-center justify-center gap-1.5"
      >
        <ExternalLink size={11} className="shrink-0" />
        Open Alerts centre
      </button>
    </div>
  );
}
