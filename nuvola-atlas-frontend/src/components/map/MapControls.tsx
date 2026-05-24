import { motion } from "framer-motion";
import { Plus, Minus, Locate, Layers } from "lucide-react";
import { springSettle } from "@/lib/motion";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onLayers: () => void;
}

function ControlBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={springSettle}
      className="w-[38px] h-[38px] glass flex items-center justify-center rounded-control text-ink-3 hover:text-ink-2 hover:bg-[rgba(255,255,255,0.08)] transition-colors"
    >
      {children}
    </motion.button>
  );
}

export default function MapControls({ onZoomIn, onZoomOut, onLocate, onLayers }: Props) {
  return (
    <motion.div
      className="flex flex-col gap-1.5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, ...springSettle }}
    >
      <ControlBtn onClick={onZoomIn} label="Zoom in"><Plus size={16} /></ControlBtn>
      <ControlBtn onClick={onZoomOut} label="Zoom out"><Minus size={16} /></ControlBtn>
      <ControlBtn onClick={onLocate} label="Re-center on Nairobi"><Locate size={16} /></ControlBtn>
      <ControlBtn onClick={onLayers} label="Toggle layers"><Layers size={16} /></ControlBtn>
    </motion.div>
  );
}
