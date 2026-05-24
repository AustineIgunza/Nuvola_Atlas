import { motion } from "framer-motion";
import AppShell from "@/components/chrome/AppShell";
import AlertList from "@/components/alerts/AlertList";

export default function AlertsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AppShell>
        <div className="p-4 sm:p-5">
          <AlertList />
        </div>
      </AppShell>
    </motion.div>
  );
}
