import { motion } from "framer-motion";
import AppLayout from "../layouts/AppLayout";
import ReportsTable from "../components/reports/ReportsTable";

function Reports() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="p-4 sm:p-5"><ReportsTable /></div>
    </motion.div>
  );
}

Reports.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
export default Reports;
