import { useState } from "react";
import { FileText, History, Save, Check } from "lucide-react";
import {
  contentBlocksApi,
  type ContentBlock,
  type Revision,
} from "@/features/admin/contentBlocks.api";
import { useAuthStore } from "@/shared/stores/auth";
import { useT } from "@/shared/lib/i18n/use-t";
import { BRAND } from "@/shared/lib/scoreColor";

/**
 * Content Management surface. Left: block picker. Right: markdown editor
 * with a diff-preview and revision history. Every save creates a revision
 * so a mistake can be rolled back.
 */
export default function ContentCms() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => contentBlocksApi.list());
  const [activeKey, setActiveKey] = useState<string>(blocks[0]?.key ?? "");
  const [draftBody, setDraftBody] = useState<string>(blocks[0]?.bodyMd ?? "");
  const [saved, setSaved] = useState(false);

  const active = blocks.find((b) => b.key === activeKey) ?? null;
  const changed = active && draftBody !== active.bodyMd;
  const revisions = active ? contentBlocksApi.revisions(active.key) : [];

  const pick = (key: string) => {
    const block = blocks.find((b) => b.key === key);
    if (!block) return;
    setActiveKey(key);
    setDraftBody(block.bodyMd);
    setSaved(false);
  };

  const publish = () => {
    if (!active) return;
    const next: ContentBlock = {
      ...active,
      bodyMd: draftBody,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email ?? "admin@nuvola.dev",
    };
    contentBlocksApi.save(next);
    setBlocks(contentBlocksApi.list());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const restore = (rev: Revision) => {
    if (
      !window.confirm(
        "Restore this revision as the current published copy? A new revision will snapshot the current version.",
      )
    )
      return;
    setDraftBody(rev.bodyMd);
  };

  return (
    <div className="space-y-3">
      <header className="mb-2">
        <h2 className="text-[14px] font-semibold text-ink-1 flex items-center gap-1.5">
          <FileText size={13} style={{ color: BRAND.terracotta }} />
          {t("cms.title")}
        </h2>
        <p className="text-[11px] text-ink-3 mt-0.5">{t("cms.subtitle")}</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        {/* Block picker */}
        <aside className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-2 space-y-0.5">
          <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.08em] px-2 py-1.5">
            {t("cms.pick")}
          </div>
          {blocks.map((b) => {
            const isActive = b.key === activeKey;
            return (
              <button
                key={b.key}
                onClick={() => pick(b.key)}
                className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-control text-left transition-colors ${
                  isActive
                    ? "bg-[rgba(192,85,43,0.14)] text-ink-1"
                    : "text-ink-2 hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-medium truncate">{b.title}</div>
                  <div className="text-[9.5px] text-ink-4 font-mono truncate">{b.key}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Editor */}
        {active && (
          <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-3.5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-ink-1 truncate">{active.title}</h3>
                <div className="text-[9.5px] text-ink-4 font-mono truncate">{active.key}</div>
              </div>
              <button
                onClick={publish}
                disabled={!changed}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-control bg-accent text-white text-[11.5px] font-semibold disabled:opacity-40 hover:brightness-110 btn-press shrink-0"
              >
                <Save size={12} /> {t("cms.publish")}
              </button>
              {saved && (
                <span className="text-[10.5px]" style={{ color: BRAND.teal }}>
                  <Check size={11} className="inline mr-0.5" /> {t("cms.savedRevision")}
                </span>
              )}
            </div>

            <label className="block">
              <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em] mb-1">
                {t("cms.editorLabel")}
              </span>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={10}
                className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-3 py-2 text-[12px] text-ink-1 placeholder-ink-4 font-mono leading-relaxed resize-y"
              />
            </label>

            <div className="text-[9.5px] text-ink-4">
              Last edited by {active.updatedBy} · {new Date(active.updatedAt).toLocaleString()}
            </div>

            {/* Revision history */}
            {revisions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5">
                  <History size={11} />
                  {t("cms.revisions", { count: revisions.length })}
                </div>
                <div className="space-y-1.5">
                  {revisions.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-control bg-[rgba(255,255,255,0.02)] border border-border px-2.5 py-1.5 flex items-start gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[9.5px] text-ink-4">
                          {r.savedBy} · {new Date(r.savedAt).toLocaleString()}
                        </div>
                        <div className="text-[10.5px] text-ink-2 line-clamp-2 mt-0.5">
                          {r.bodyMd}
                        </div>
                      </div>
                      <button
                        onClick={() => restore(r)}
                        className="text-[10.5px] font-medium text-ink-3 hover:text-accent shrink-0"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
