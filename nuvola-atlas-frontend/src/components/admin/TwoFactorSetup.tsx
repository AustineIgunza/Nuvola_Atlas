import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, Check, Mail } from "lucide-react";
import { twoFactorApi, type EmailStartResponse } from "@/api/twoFactor";

type Step = "intro" | "code" | "done";

interface Props {
  onComplete: () => void;
}

/**
 * Email-based 2FA enrolment.
 *   1. intro — explanation + "Send code to my email" button.
 *   2. code  — POST /auth/2fa/email/start fired; user enters the 6 digits
 *              from the inbox; POST /auth/2fa/email/confirm.
 *   3. done  — success card. Parent invalidates dashboard queries.
 */
export default function TwoFactorSetup({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [emailHint, setEmailHint] = useState<string>("");
  const [code, setCode] = useState("");

  const start = useMutation({
    mutationFn: () => twoFactorApi.emailStart(),
    onSuccess: (res: EmailStartResponse) => {
      setEmailHint(res.email_hint);
      setStep("code");
    },
  });

  const confirm = useMutation({
    mutationFn: (c: string) => twoFactorApi.emailConfirm(c),
    onSuccess: () => setStep("done"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-[480px] mx-auto glass rounded-control p-6 space-y-5"
    >
      <header className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-control bg-[rgba(192,85,43,0.15)] text-accent flex items-center justify-center shrink-0">
          <Shield size={18} />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-ink-1">Two-factor authentication</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">
            We'll email you a 6-digit code each time you sign in. Admin accounts must enrol before
            the dashboard is reachable.
          </p>
        </div>
      </header>

      {step === "intro" && (
        <div className="space-y-3">
          <ul className="text-[12px] text-ink-3 space-y-1 list-disc pl-5">
            <li>No authenticator app needed — codes arrive in your inbox.</li>
            <li>Codes expire after 5 minutes; one code per sign-in.</li>
            <li>Disable any time with your password + a fresh code.</li>
          </ul>
          {start.isError && (
            <div className="text-[12px] text-danger">{(start.error as Error).message}</div>
          )}
          <button
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <Mail size={14} />
            {start.isPending ? "Sending…" : "Send code to my email"}
          </button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-4">
          <div className="rounded-control p-3 bg-[rgba(192,85,43,0.08)] ring-1 ring-[rgba(192,85,43,0.25)]">
            <div className="flex items-start gap-2">
              <Mail size={14} className="text-accent mt-0.5 shrink-0" />
              <div className="text-[12px] text-ink-2">
                Code sent to <span className="font-mono text-ink-1">{emailHint}</span>. It expires
                in 5 minutes.
              </div>
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
            className="w-full h-12 px-4 rounded-control bg-[rgba(255,255,255,0.04)] text-[20px] tabular-nums text-center tracking-[0.4em] text-ink-1 outline-none focus:ring-1 focus:ring-accent"
          />

          {confirm.isError && (
            <div className="text-[12px] text-danger">{(confirm.error as Error).message}</div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => start.mutate()}
              disabled={start.isPending}
              className="text-[12px] text-ink-3 hover:text-ink-2 disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              onClick={() => confirm.mutate(code)}
              disabled={code.length !== 6 || confirm.isPending}
              className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold disabled:opacity-40"
            >
              {confirm.isPending ? "Verifying…" : "Verify & enable"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[rgba(57,210,143,0.15)] text-success flex items-center justify-center">
            <Check size={22} />
          </div>
          <div className="text-[14px] font-semibold text-ink-1">2FA is on</div>
          <div className="text-[12px] text-ink-3">
            Every sign-in now requires a fresh code from your inbox.
          </div>
          <button
            onClick={onComplete}
            className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold"
          >
            Continue to dashboard
          </button>
        </div>
      )}
    </motion.div>
  );
}
