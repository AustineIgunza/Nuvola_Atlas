import { useEffect, useState } from "react";
import { Check, Lock, Save } from "lucide-react";
import { useAuthStore, isInvestor } from "@/stores/auth";
import { zoneNotesApi } from "@/api/zoneNotes";
import { useT } from "@/lib/i18n/use-t";
import { BRAND } from "@/lib/scoreColor";

interface Props {
  zoneId: string;
  zoneName: string;
}

/**
 * Investor-only private thesis notes card. Shown on the scorecard drill-in
 * whenever the signed-in user is an investor. Notes persist per (firmId,
 * zoneId) so switching firms shows only that firm's notes. Non-investors
 * never see this card.
 */
export default function ZoneNotesCard({ zoneId, zoneName }: Props) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const firmId = user?.firm?.id;
  const [body, setBody] = useState("");
  const [initialBody, setInitialBody] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!firmId) return;
    const existing = zoneNotesApi.get(firmId, zoneId);
    const initial = existing?.body ?? "";
    setBody(initial);
    setInitialBody(initial);
    setSaved(false);
  }, [firmId, zoneId]);

  if (!isInvestor(user) || !firmId || !user) return null;

  const changed = body !== initialBody;

  const save = () => {
    zoneNotesApi.save({
      firmId,
      zoneId,
      body: body.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: user.email,
    });
    setInitialBody(body);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div
      className="rounded-card border p-3 space-y-2"
      style={{
        background: `${BRAND.teal}0F`,
        borderColor: `${BRAND.teal}33`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Lock size={11} style={{ color: BRAND.teal }} />
        <span
          className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
          style={{ color: BRAND.teal }}
        >
          {t("notes.private")}
        </span>
        <span className="text-[10.5px] font-semibold text-ink-1 ml-auto truncate">
          {t("notes.title", { zone: zoneName })}
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t("notes.placeholder")}
        className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[11.5px] text-ink-1 placeholder-ink-4 resize-y leading-relaxed"
      />

      <div className="flex items-center gap-2">
        {saved ? (
          <span
            className="inline-flex items-center gap-1 text-[10.5px] font-medium"
            style={{ color: BRAND.teal }}
          >
            <Check size={11} /> {t("notes.saved")}
          </span>
        ) : (
          <span className="text-[9.5px] text-ink-4 truncate">{body.length} chars</span>
        )}
        <button
          onClick={save}
          disabled={!changed || !body.trim()}
          className="ml-auto inline-flex items-center gap-1 px-2.5 h-7 rounded-control bg-accent text-white text-[10.5px] font-semibold disabled:opacity-40 hover:brightness-110 shrink-0"
        >
          <Save size={11} /> {t("common.save")}
        </button>
      </div>
    </div>
  );
}
