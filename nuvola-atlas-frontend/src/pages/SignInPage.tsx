import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/api";
import { springSettle } from "@/lib/motion";

function BrandMark() {
  return (
    <motion.div
      className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ background: "conic-gradient(from 135deg, #4a9eff, #b888ff, #4a9eff)" }}
      whileHover={{ rotate: 90, scale: 1.1 }}
      transition={springSettle}
    >
      <div className="w-[20px] h-[20px] rounded-md bg-atlas-base flex items-center justify-center">
        <div className="w-[5px] h-[5px] rounded-full bg-white" />
      </div>
    </motion.div>
  );
}

export default function SignInPage() {
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/atlas" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.signIn(email, password);
      signIn(res.user, res.token);
      navigate("/atlas", { replace: true });
    } catch {
      setError("Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="glass-strong rounded-login w-full max-w-[420px] p-8 shadow-modal"
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, ...springSettle }}
          className="flex items-center gap-3 mb-8"
        >
          <BrandMark />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-ink-1">Nuvola Atlas</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[24px] font-semibold tracking-[-0.02em] text-ink-1 mb-1"
        >
          Sign in
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-[13px] text-ink-3 mb-7"
        >
          Spatial Intelligence Network for African Industrial Development
        </motion.p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label htmlFor="email" className="block text-[12px] font-medium text-ink-3 mb-1.5">Email</label>
            <input
              id="email" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[14px] placeholder:text-ink-4 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <label htmlFor="password" className="block text-[12px] font-medium text-ink-3 mb-1.5">Password</label>
            <input
              id="password" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[14px] placeholder:text-ink-4 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              placeholder="Password"
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] text-danger"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(74,158,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-control bg-accent text-white text-[14px] font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              "Continue"
            )}
          </motion.button>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-[12px] text-ink-3 mt-5 text-center"
        >
          No account?{" "}
          <Link to="/sign-up" className="text-accent hover:underline font-medium">Create one</Link>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] text-ink-4 mt-4 text-center"
        >
          Strathmore University · Student-led Innovation
        </motion.p>
      </motion.div>
    </div>
  );
}
