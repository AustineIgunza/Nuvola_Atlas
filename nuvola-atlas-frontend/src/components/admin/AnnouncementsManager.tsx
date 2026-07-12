import { useState } from "react";
import { AlertTriangle, Info, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { announcementsApi, type Announcement, type AnnouncementSeverity, type AnnouncementScope } from "@/api/announcements";
import { FIRMS } from "@/api/firms";
import { BRAND } from "@/lib/scoreColor";

/**
 * Admin-side announcements CRUD. Composes messages that appear as a
 * dismissible banner across the app for the target scope (global, role,
 * or firm). Mock-only until the Phase E migrations land.
 */
export default function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>(() => announcementsApi.list());
  const [composing, setComposing] = useState(false);

  const refresh = () => setItems(announcementsApi.list());

  const remove = (id: string) => {
    if (!window.confirm("Delete this announcement? Users won't see it again.")) return;
    announcementsApi.delete(id);
    refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[11.5px] text-ink-3">
          {items.length} announcement{items.length === 1 ? "" : "s"} · showing to matched scopes
        </div>
        <button
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 h-7 rounded-control bg-accent text-white hover:brightness-110 btn-press"
        >
          <Plus size={12} /> New announcement
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-card border border-border p-6 text-center text-[11.5px] text-ink-4">
            No announcements yet.
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3.5 flex items-start gap-2.5"
            >
              <SeverityIcon severity={a.severity} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12.5px] font-semibold text-ink-1">{a.title}</span>
                  <ScopeBadge scope={a.scope} />
                </div>
                <p className="text-[10.5px] text-ink-3 mt-1 leading-relaxed">{a.body}</p>
                <div className="mt-2 text-[9.5px] text-ink-4">
                  From {a.createdBy} · {new Date(a.createdAt).toLocaleString()}{" "}
                  {a.endsAt && `· ends ${new Date(a.endsAt).toLocaleDateString()}`}
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                aria-label="Delete announcement"
                className="text-ink-4 hover:text-danger shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSave={(a) => {
            announcementsApi.save(a);
            refresh();
            setComposing(false);
          }}
        />
      )}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: AnnouncementSeverity }) {
  if (severity === "critical") return <ShieldAlert size={14} className="shrink-0" style={{ color: BRAND.rose }} />;
  if (severity === "warning") return <AlertTriangle size={14} className="shrink-0" style={{ color: BRAND.gold }} />;
  return <Info size={14} className="shrink-0" style={{ color: BRAND.teal }} />;
}

function ScopeBadge({ scope }: { scope: AnnouncementScope }) {
  const label =
    scope.kind === "global"
      ? "Global"
      : scope.kind === "role"
      ? `Role: ${scope.role}`
      : `Firm: ${FIRMS.find((f) => f.id === scope.firmId)?.name ?? scope.firmId}`;
  const color = scope.kind === "global" ? BRAND.steel : scope.kind === "role" ? BRAND.teal : BRAND.gold;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

function ComposeModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (a: Announcement) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<AnnouncementSeverity>("info");
  const [scopeKind, setScopeKind] = useState<"global" | "role" | "firm">("global");
  const [role, setRole] = useState<"viewer" | "partner" | "investor" | "editor" | "admin">("investor");
  const [firmId, setFirmId] = useState<string>(FIRMS[0]?.id ?? "");
  const [endsAt, setEndsAt] = useState("");
  const [dismissible, setDismissible] = useState(true);

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    const scope: AnnouncementScope =
      scopeKind === "global"
        ? { kind: "global" }
        : scopeKind === "role"
        ? { kind: "role", role }
        : { kind: "firm", firmId };
    onSave({
      id: `ann-${Date.now().toString(36)}`,
      title: title.trim(),
      body: body.trim(),
      severity,
      scope,
      startsAt: new Date().toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      dismissible,
      createdBy: "admin@navuuna.dev",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] rounded-modal glass-strong border border-border shadow-modal p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[15px] font-semibold text-ink-1 flex-1">New announcement</h3>
          <button onClick={onClose} className="text-ink-4 hover:text-ink-2" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <label className="block">
          <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12.5px] text-ink-1 placeholder-ink-4"
            placeholder="Short heading"
          />
        </label>

        <label className="block">
          <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12px] text-ink-2 placeholder-ink-4 resize-none"
            placeholder="What should the audience know?"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">Severity</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AnnouncementSeverity)}
              className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12px] text-ink-1"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">Ends at (optional)</span>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12px] text-ink-1"
            />
          </label>
        </div>

        <div>
          <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">Scope</span>
          <div className="flex gap-1.5 mb-2">
            {(["global", "role", "firm"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setScopeKind(k)}
                className={
                  "px-2.5 py-1 rounded-full text-[10.5px] font-medium border " +
                  (scopeKind === k
                    ? "bg-[rgba(31,138,120,0.14)] border-[rgba(31,138,120,0.35)] text-ink-1"
                    : "bg-[rgba(255,255,255,0.03)] border-border text-ink-3")
                }
              >
                {k}
              </button>
            ))}
          </div>
          {scopeKind === "role" && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12px] text-ink-1"
            >
              <option value="viewer">Viewer</option>
              <option value="partner">Partner</option>
              <option value="investor">Investor</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          )}
          {scopeKind === "firm" && (
            <select
              value={firmId}
              onChange={(e) => setFirmId(e.target.value)}
              className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[12px] text-ink-1"
            >
              {FIRMS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <label className="flex items-center gap-2 text-[11.5px] text-ink-2">
          <input
            type="checkbox"
            checked={dismissible}
            onChange={(e) => setDismissible(e.target.checked)}
            className="accent-accent"
          />
          Users can dismiss this
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 h-8 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-[11.5px] text-ink-3"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || !body.trim()}
            className="px-3 h-8 rounded-control bg-accent text-white text-[11.5px] font-semibold disabled:opacity-50 btn-press"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
