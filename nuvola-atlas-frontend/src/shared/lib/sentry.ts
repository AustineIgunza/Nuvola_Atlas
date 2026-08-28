import * as Sentry from "@sentry/react";

/**
 * Initialises Sentry at app boot. Safe to call unconditionally — if
 * `VITE_SENTRY_DSN` is empty (local dev, preview without DSN), the SDK is
 * never initialised and the rest of the app has zero observable cost.
 *
 * The DSN is public (it identifies the Sentry project, not a credential);
 * `SENTRY_AUTH_TOKEN` is the build-time secret used by the Vite plugin to
 * upload source maps and lives on Vercel, never in the bundle.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    // Match the backend default (10% traces) for the pilot; tune from the
    // Sentry UI once we have real traffic data.
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // Privacy-first: no replay, no PII, no automatic breadcrumb capture of
    // user input. Partners' session data is more sensitive than crash detail.
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export function captureBoundaryError(
  error: Error,
  componentStack: string | null | undefined,
): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.captureException(error, {
    contexts: {
      react: { componentStack: componentStack ?? "" },
    },
  });
}
