import { useState } from "react";
import { useNavigate, Navigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import { useAuthStore, type AuthRole } from "@/shared/stores/auth";
import { api } from "@/api";
import { twoFactorApi } from "@/api/twoFactor";
import { springSettle } from "@/shared/lib/motion";
import { Emblem, Wordmark } from "@/shared/ui/Brand";
import { GoogleButton } from "@/features/account/GoogleButton";

type SignInLocationState = {
  justRegistered?: boolean;
  email?: string;
};

interface ChallengeState {
  token: string;
  emailHint: string;
}

export default function SignInPage() {
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? null) as SignInLocationState | null;
  const [email, setEmail] = useState(navState?.email ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justRegistered, setJustRegistered] = useState(Boolean(navState?.justRegistered));
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [code, setCode] = useState("");

  if (user) return <Navigate to="/atlas" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    setJustRegistered(false);
    try {
      const res = await api.signIn(email, password);
      // Backend signals "code emailed, finish the challenge to get a token"
      // with `requires_two_factor: true`. Switch the form into code-entry
      // mode instead of completing sign-in here.
      if ("requires_two_factor" in res) {
        setChallenge({ token: res.challenge_token, emailHint: res.email_hint });
        setCode("");
        return;
      }
      signIn({ ...res.user, role: res.user.role as AuthRole | undefined }, res.token);
      // Investors: seed their firm's watchlist into the local store so
      // the ★ chips render pre-populated across the app. Non-investors
      // never touch the watchlist store, so this branch is inert for them.
      const firm = (res.user as { firm?: { watchlist?: string[] } }).firm;
      const firmWatchlist = firm && Array.isArray(firm.watchlist) ? firm.watchlist : [];
      if (firmWatchlist.length > 0) {
        const { useWatchlistStore } = await import("@/shared/stores/watchlist");
        useWatchlistStore.getState().hydrate(firmWatchlist);
      }
      // Investors land on their own dashboard; everyone else lands on the atlas.
      const landing = res.user.role === "investor" ? "/investor" : "/atlas";
      navigate(landing, { replace: true });
    } catch {
      setError("Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await twoFactorApi.verify(challenge.token, code);
      signIn(
        {
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as "viewer" | "partner" | "editor" | "admin",
          email_verified: res.user.email_verified,
        },
        res.token,
      );
      navigate("/atlas", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!challenge) return;
    // Restart the sign-in to mint a fresh challenge token + email a new code.
    setLoading(true);
    try {
      const res = await api.signIn(email, password);
      if ("requires_two_factor" in res) {
        setChallenge({ token: res.challenge_token, emailHint: res.email_hint });
        setCode("");
        setError("");
      }
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
        className="glass-strong rounded-login w-full max-w-[420px] p-6 sm:p-8 shadow-modal"
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, ...springSettle }}
          className="flex items-center gap-2.5 mb-8"
        >
          <motion.div whileHover={{ rotate: 8, scale: 1.08 }} transition={springSettle}>
            <Emblem size={32} />
          </motion.div>
          <Wordmark className="text-[20px]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[24px] font-semibold tracking-[-0.02em] text-ink-1 mb-1"
        >
          {challenge ? "Check your email" : "Sign in"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-[13px] text-ink-3 mb-7"
        >
          {challenge
            ? `We sent a 6-digit code to ${challenge.emailHint}. It expires in 5 minutes.`
            : "Africa's Ground Truth — infrastructure and heritage on one living ledger"}
        </motion.p>

        <AnimatePresence>
          {justRegistered && (
            <motion.div
              key="signup-success"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={springSettle}
              role="status"
              className="mb-5 rounded-control border border-success/30 bg-success/10 px-4 py-3 text-[12px] text-ink-1"
            >
              <span className="font-medium text-success">Account created.</span>{" "}
              <span className="text-ink-2">Sign in to continue.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {challenge && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="rounded-control p-3 bg-[rgba(192,85,43,0.08)] ring-1 ring-[rgba(192,85,43,0.25)] flex items-start gap-2">
              <Mail size={14} className="text-accent mt-0.5 shrink-0" />
              <div className="text-[12px] text-ink-2">
                Code sent to <span className="font-mono text-ink-1">{challenge.emailHint}</span>
              </div>
            </div>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              autoFocus
              autoComplete="one-time-code"
              className="w-full h-12 px-4 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-[20px] tabular-nums text-center tracking-[0.4em] text-ink-1 placeholder:text-ink-4 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[12px] text-danger"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-11 rounded-control bg-accent text-white text-[14px] font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>

            <div className="flex items-center justify-between text-[12px]">
              <button
                type="button"
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                  setError("");
                }}
                className="text-ink-3 hover:text-ink-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-accent hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {!challenge && (
          <>
            <div className="mb-4">
              <GoogleButton />
            </div>
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-ink-4">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="email" className="block text-[12px] font-medium text-ink-3 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[14px] placeholder:text-ink-4 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="you@example.com"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label
                  htmlFor="password"
                  className="block text-[12px] font-medium text-ink-3 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
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
                whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(192,85,43,0.28)" }}
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
          </>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-[12px] text-ink-3 mt-5 text-center"
        >
          No account?{" "}
          <Link to="/sign-up" className="text-accent hover:underline font-medium">
            Create one
          </Link>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48 }}
          className="text-[11px] text-ink-4 mt-2 text-center"
        >
          Just exploring?{" "}
          <Link to="/public" className="text-ink-2 hover:text-accent hover:underline font-medium">
            Open the public preview
          </Link>
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
