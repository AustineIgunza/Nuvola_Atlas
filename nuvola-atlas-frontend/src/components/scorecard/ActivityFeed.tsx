import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { formatRelative } from "@/shared/lib/format";

const KIND_COLORS: Record<string, string> = {
  road: "#C0552B",
  grid: "#1F8A78",
  esia: "#1F8A78",
  transit: "#E0A82E",
  water: "#176B5D",
};

interface Props {
  zoneId: string;
}

export default function ActivityFeed({ zoneId }: Props) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activity", zoneId],
    queryFn: () => api.getZoneActivity(zoneId),
  });

  if (isLoading) return null;

  if (!activities || activities.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em]">
          Recent Activity
        </div>
        <p className="text-[11px] text-ink-4 leading-[1.5]">
          No recent activity recorded for this zone — field updates will appear here as they sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em]">
        Recent Activity
      </div>
      {activities.slice(0, 6).map((a) => (
        <div key={a.id} className="flex items-start gap-2.5">
          <div
            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
            style={{ background: KIND_COLORS[a.kind] ?? "#C0552B" }}
          />
          <div className="min-w-0">
            <p className="text-[12px] text-ink-2 leading-[1.5]">{a.text}</p>
            <p className="text-[11px] text-ink-4">
              {a.source} · {formatRelative(a.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
