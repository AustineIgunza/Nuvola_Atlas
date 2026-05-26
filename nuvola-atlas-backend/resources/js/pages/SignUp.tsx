import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { springSettle } from "../lib/motion";
import { api } from "../api";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await api.register(name, email, password, confirm);
      router.visit("/atlas");
    } catch (err) { setError(err instanceof Error ? err.message : "Registration failed"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full h-11 px-4 rounded-control bg-ink/[0.04] border border-border text-ink-1 text-[14px] placeholder:text-ink-4 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }} className="glass-strong rounded-login w-full max-w-[420px] p-8 shadow-modal">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, ...springSettle }} className="flex items-center gap-3 mb-8">
          <motion.div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "conic-gradient(from 135deg, #40798C, #C9A227, #40798C)" }} whileHover={{ rotate: 90, scale: 1.1 }} transition={springSettle}>
            <div className="w-[20px] h-[20px] rounded-md bg-surface flex items-center justify-center"><div className="w-[5px] h-[5px] rounded-full bg-ink" /></div>
          </motion.div>
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-ink-1">Nuvola Atlas</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[24px] font-semibold tracking-[-0.02em] text-ink-1 mb-1">Create account</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-[13px] text-ink-3 mb-7">Join the Spatial Intelligence Network</motion.p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <label htmlFor="name" className="block text-[12px] font-medium text-ink-3 mb-1.5">Full name</label>
            <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label htmlFor="reg-email" className="block text-[12px] font-medium text-ink-3 mb-1.5">Email</label>
            <input id="reg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <label htmlFor="reg-password" className="block text-[12px] font-medium text-ink-3 mb-1.5">Password</label>
            <input id="reg-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Min 8 characters" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <label htmlFor="reg-confirm" className="block text-[12px] font-medium text-ink-3 mb-1.5">Confirm password</label>
            <input id="reg-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="Repeat password" />
          </motion.div>
          {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-danger">{error}</motion.p>}
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="w-full h-11 rounded-control bg-accent text-white text-[14px] font-semibold hover:brightness-110 disabled:opacity-50 transition-all">
            {loading ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : "Create account"}
          </motion.button>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-[12px] text-ink-3 mt-5 text-center">
          Already have an account? <Link href="/sign-in" className="text-accent hover:underline font-medium">Sign in</Link>
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[11px] text-ink-4 mt-4 text-center">Strathmore University · Student-led Innovation</motion.p>
      </motion.div>
    </div>
  );
}
