import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore, type AuthRole } from "@/stores/auth";
import { BASE, authHeaders } from "@/api/client";
import { Emblem, Wordmark } from "@/components/brand/Brand";

/**
 * Landing route the backend redirects to after Google callback. Reads
 * ?token=<sanctum> from the URL, saves it, hydrates /auth/me, then
 * navigates to the role's landing page. If ?error= is present, bounces
 * back to /sign-in with the error surfaced.
 */
export default function GoogleCompletePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    const token = params.get("token");
    const errorCode = params.get("error");

    if (errorCode) {
      navigate("/sign-in?error=" + encodeURIComponent(errorCode), { replace: true });
      return;
    }
    if (!token) {
      setStatus("error");
      setMessage("No token returned from Google callback.");
      return;
    }

    (async () => {
      try {
        // Persist token first so authHeaders() picks it up on the /auth/me call.
        localStorage.setItem("nuvola_token", token);
        const response = await fetch(`${BASE}/auth/me`, {
          headers: { Accept: "application/json", ...authHeaders() },
        });
        if (!response.ok) {
          throw new Error(`me responded ${response.status}`);
        }
        const me = (await response.json()) as {
          id: number;
          name: string;
          email: string;
          role?: string;
          email_verified?: boolean;
        };
        signIn(
          {
            name: me.name,
            email: me.email,
            role: me.role as AuthRole | undefined,
            email_verified: me.email_verified,
          },
          token,
        );
        const landing = me.role === "investor" ? "/investor" : "/atlas";
        navigate(landing, { replace: true });
      } catch {
        setStatus("error");
        setMessage("Sign-in completed at Google but /auth/me failed. Try signing in again.");
        localStorage.removeItem("nuvola_token");
      }
    })();
  }, [params, navigate, signIn]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="glass-strong rounded-login w-full max-w-[420px] p-6 sm:p-8 shadow-modal"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <Emblem size={32} />
          <Wordmark className="text-[20px]" />
        </div>

        {status === "loading" ? (
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full"
            />
            <p className="text-[13px] text-ink-2">{message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-danger">{message}</p>
            <button
              type="button"
              onClick={() => navigate("/sign-in", { replace: true })}
              className="w-full h-11 rounded-control bg-accent text-white text-[14px] font-semibold"
            >
              Back to sign in
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
