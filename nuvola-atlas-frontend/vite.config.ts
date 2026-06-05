import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { resolve } from "path";

// Source-map upload to Sentry only happens when both an org/project and an
// auth token are present in the build env. Vercel Production sets these;
// previews and local builds skip the upload step entirely, so no Sentry
// account is required for `npm run build` to succeed.
const sentryEnabled =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT;

export default defineConfig({
  plugins: [
    react(),
    ...(sentryEnabled
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            telemetry: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    // Sentry needs hidden source maps to symbolicate prod stacks without
    // shipping the maps in the bundle URL. Plugin uploads them then strips
    // the //# sourceMappingURL comment.
    sourcemap: sentryEnabled ? "hidden" : false,
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ["mapbox-gl"],
        },
      },
    },
  },
});
