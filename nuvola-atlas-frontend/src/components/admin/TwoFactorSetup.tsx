import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Copy, Check, AlertTriangle } from "lucide-react";
import { twoFactorApi, type EnableResponse } from "@/api/twoFactor";

type Step = "intro" | "scan" | "confirm" | "done";

interface Props {
  onComplete: () => void;
}

/**
 * Walks an admin through TOTP enrolment:
 *   1. intro    — explanation + "Enable 2FA" button.
 *   2. scan     — POST /auth/2fa/enable; show QR + secret + recovery codes.
 *   3. confirm  — user enters first TOTP; POST /auth/2fa/confirm.
 *   4. done     — success card; parent refetches the dashboard query.
 */
export default function TwoFactorSetup({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [enrolment, setEnrolment] = useState<EnableResponse | null>(null);
  const [code, setCode] = useState("");
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const enable = useMutation({
    mutationFn: () => twoFactorApi.enable(),
    onSuccess: (res) => {
      setEnrolment(res);
      setStep("scan");
    },
  });

  const confirm = useMutation({
    mutationFn: (c: string) => twoFactorApi.confirm(c),
    onSuccess: () => setStep("done"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-[520px] mx-auto glass rounded-control p-6 space-y-5"
    >
      <header className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-control bg-[rgba(74,158,255,0.15)] text-accent flex items-center justify-center shrink-0">
          <Shield size={18} />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-ink-1">Two-factor authentication required</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">
            Admin accounts must be protected by a TOTP authenticator before the
            dashboard is reachable. Takes about a minute.
          </p>
        </div>
      </header>

      {step === "intro" && (
        <div className="space-y-3">
          <ul className="text-[12px] text-ink-3 space-y-1 list-disc pl-5">
            <li>Use any authenticator app — Google Authenticator, Authy, 1Password, Bitwarden.</li>
            <li>You'll get 8 single-use recovery codes — store them somewhere safe.</li>
            <li>2FA can be disabled later from this page (password + code required).</li>
          </ul>
          {enable.isError && (
            <div className="text-[12px] text-danger">{(enable.error as Error).message}</div>
          )}
          <button
            onClick={() => enable.mutate()}
            disabled={enable.isPending}
            className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold disabled:opacity-50"
          >
            {enable.isPending ? "Generating…" : "Enable 2FA"}
          </button>
        </div>
      )}

      {step === "scan" && enrolment && (
        <div className="space-y-4">
          <div className="text-[12px] text-ink-2">
            <strong className="font-semibold">1.</strong> Scan this QR with your authenticator,
            or paste the secret manually.
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
            <div className="bg-white rounded-control p-3 shrink-0">
              <QRCodeSVG value={enrolment.otpauth_uri} size={156} level="M" />
            </div>
            <div className="flex-1 w-full min-w-0">
              <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.06em] mb-1">
                Secret
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1.5 rounded-control bg-[rgba(0,0,0,0.3)] text-[11px] text-ink-1 font-mono break-all">
                  {enrolment.secret}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(enrolment.secret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="shrink-0 w-8 h-8 rounded-control bg-[rgba(255,255,255,0.06)] text-ink-2 flex items-center justify-center hover:text-ink-1"
                >
                  {copiedSecret ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-control p-3 bg-[rgba(255,189,89,0.08)] ring-1 ring-[rgba(255,189,89,0.3)]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <div className="text-[12px] font-medium text-warning">
                  <strong className="font-semibold">2.</strong> Save your recovery codes
                </div>
                <div className="text-[11px] text-ink-3">
                  Each is single-use. Use one if you lose your authenticator. Cannot be recovered later.
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {enrolment.recovery_codes.map((c) => (
                    <code key={c} className="px-2 py-1 rounded text-[10px] text-ink-1 font-mono bg-[rgba(0,0,0,0.2)]">
                      {c}
                    </code>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={recoveryAcknowledged}
                    onChange={(e) => setRecoveryAcknowledged(e.target.checked)}
                    className="accent-warning"
                  />
                  <span className="text-[11px] text-ink-2">I've saved my recovery codes</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep("confirm")}
            disabled={!recoveryAcknowledged}
            className="px-4 h-9 rounded-control bg-accent text-white text-[12px] font-semibold disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <div className="text-[12px] text-ink-2">
            <strong className="font-semibold">3.</strong> Enter the 6-digit code your authenticator
            is showing right now.
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
            className="w-full h-12 px-4 rounded-control bg-[rgba(255,255,255,0.04)] text-[20px] tabular-nums text-center tracking-[0.4em] text-ink-1 outline-none focus:ring-1 focus:ring-accent"
          />
          {confirm.isError && (
            <div className="text-[12px] text-danger">{(confirm.error as Error).message}</div>
          )}
          <div className="flex justify-between">
            <button
              onClick={() => setStep("scan")}
              className="px-3 h-9 rounded-control text-[12px] text-ink-3 hover:text-ink-2"
            >
              ← Back
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
            From now on, every sign-in needs your authenticator code.
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
