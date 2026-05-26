import { motion } from "framer-motion";
import AppLayout from "../layouts/AppLayout";
import AlertList from "../components/alerts/AlertList";

function Alerts() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="p-4 sm:p-5"><AlertList /></div>
    </motion.div>
  );
}

Alerts.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
export default Alerts;
