import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/api";
import { springSettle, modalBackdrop, modalContent } from "@/lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewReportModal({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [zoneId, setZoneId] = useState("");
  const queryClient = useQueryClient();

  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones, enabled: open });

  const mutation = useMutation({
    mutationFn: () => api.createReport({ title, zoneId: zoneId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setTitle("");
      setZoneId("");
      onClose();
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springSettle}
            className="relative glass-strong rounded-modal w-full max-w-[420px] shadow-modal p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-semibold text-ink-1">New report</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2"
                aria-label="Close"
              >
                <X size={14} />
              </motion.button>
            </div>

            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[13px] placeholder:text-ink-4 focus:border-accent transition-all"
                  placeholder="Report title"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[13px] focus:border-accent transition-all"
                >
                  <option value="">All zones</option>
                  {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => mutation.mutate()}
                disabled={!title || mutation.isPending}
                className="w-full h-10 rounded-control bg-accent text-white text-[13px] font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {mutation.isPending ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  "Generate"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
