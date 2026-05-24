import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, X, MapPin, HardHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { springSettle, modalBackdrop, modalContent, staggerContainer, staggerItem } from "@/lib/motion";
import { useUIStore } from "@/stores/ui";
import { api } from "@/api";
import { scoreColor } from "@/lib/scoreColor";

export default function SearchModal() {
  const open = useUIStore((s) => s.searchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones, enabled: open });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects, enabled: open });

  const q = query.toLowerCase();
  const filteredZones = zones?.filter((z) => z.name.toLowerCase().includes(q)) ?? [];
  const filteredProjects = projects?.filter((p) => p.name.toLowerCase().includes(q)) ?? [];
  const allItems = [
    ...filteredZones.map((z) => ({ type: "zone" as const, id: z.id, label: z.name, score: z.score })),
    ...filteredProjects.map((p) => ({ type: "project" as const, id: p.id, label: p.name, score: null as number | null })),
  ];

  useEffect(() => {
    if (open) { setQuery(""); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const handleSelect = useCallback((item: (typeof allItems)[0]) => {
    closeSearch();
    if (item.type === "zone") { setSelectedZone(item.id); navigate("/atlas"); }
    else navigate(`/infrastructure/${item.id}`);
  }, [closeSearch, setSelectedZone, navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) closeSearch(); else useUIStore.getState().openSearch();
      }
      if (!open) return;
      if (e.key === "Escape") closeSearch();
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allItems[activeIdx]) handleSelect(allItems[activeIdx]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIdx, allItems, closeSearch, handleSelect]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={closeSearch}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springSettle}
            className="relative glass-strong rounded-modal w-full max-w-[560px] shadow-modal overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-border">
              <Search size={18} className="text-ink-3 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-ink-1 placeholder:text-ink-4 outline-none"
                placeholder="Search sub-counties and projects..."
              />
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:block px-1.5 py-0.5 rounded text-[10px] font-medium text-ink-4 bg-[rgba(255,255,255,0.06)] border border-border">
                  ESC
                </kbd>
                <button onClick={closeSearch} className="text-ink-4 hover:text-ink-3 btn-press" aria-label="Close search">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto py-2">
              {filteredZones.length > 0 && (
                <div>
                  <div className="px-5 py-2 text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] flex items-center gap-1.5">
                    <MapPin size={11} />
                    Sub-counties
                  </div>
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                    {filteredZones.map((z) => {
                      const idx = allItems.findIndex((i) => i.type === "zone" && i.id === z.id);
                      return (
                        <motion.button
                          key={z.id}
                          variants={staggerItem}
                          transition={springSettle}
                          onClick={() => handleSelect({ type: "zone", id: z.id, label: z.name, score: z.score })}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 h-10 text-[13px] transition-all",
                            idx === activeIdx
                              ? "bg-[rgba(74,158,255,0.1)] text-ink-1"
                              : "text-ink-2 hover:bg-[rgba(255,255,255,0.04)]",
                          )}
                        >
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform" style={{ background: scoreColor(z.score), transform: idx === activeIdx ? "scale(1.3)" : "scale(1)" }} />
                          <span className="font-medium">{z.name}</span>
                          <span className="ml-auto tabular-nums text-ink-4 text-[12px]">{z.score}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {filteredProjects.length > 0 && (
                <div>
                  <div className="px-5 py-2 text-[11px] font-medium text-ink-4 uppercase tracking-[0.08em] flex items-center gap-1.5 mt-1">
                    <HardHat size={11} />
                    Projects
                  </div>
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                    {filteredProjects.map((p) => {
                      const idx = allItems.findIndex((i) => i.type === "project" && i.id === p.id);
                      return (
                        <motion.button
                          key={p.id}
                          variants={staggerItem}
                          transition={springSettle}
                          onClick={() => handleSelect({ type: "project", id: p.id, label: p.name, score: null })}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 h-10 text-[13px] transition-all",
                            idx === activeIdx
                              ? "bg-[rgba(74,158,255,0.1)] text-ink-1"
                              : "text-ink-2 hover:bg-[rgba(255,255,255,0.04)]",
                          )}
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-auto text-ink-4 text-[11px]">{p.agency}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {allItems.length === 0 && query && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-10 text-center text-[13px] text-ink-4"
                >
                  No results for "{query}"
                </motion.div>
              )}

              {!query && (
                <div className="px-5 py-8 text-center text-[12px] text-ink-4">
                  Start typing to search sub-counties and projects
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
