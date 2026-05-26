import { motion } from "framer-motion";
import AppLayout from "../layouts/AppLayout";
import Leaderboard from "../components/vitality/Leaderboard";

function Vitality() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="p-4 sm:p-5"><Leaderboard /></div>
    </motion.div>
  );
}

Vitality.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
export default Vitality;
