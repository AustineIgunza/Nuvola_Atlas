import { motion } from "framer-motion";
import AppShell from "@/shared/chrome/AppShell";
import Leaderboard from "@/components/vitality/Leaderboard";

export default function VitalityPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AppShell>
        <div className="p-4 sm:p-5">
          <Leaderboard />
        </div>
      </AppShell>
    </motion.div>
  );
}
