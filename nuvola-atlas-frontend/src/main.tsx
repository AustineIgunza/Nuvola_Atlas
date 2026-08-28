import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/shared/ui/ErrorBoundary";
import { initSentry } from "@/shared/lib/sentry";
import App from "./App";
import "./index.css";

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        console.error("[Mutation Error]", error.message);
      },
    },
  },
});

// Zones change on a quarterly-ish cadence (ingestion runs are scheduled, not
// real-time), so a 5-minute staleTime cuts refetch chatter without making the
// UI feel stale. See §9.9.
queryClient.setQueryDefaults(["zones"], { staleTime: 5 * 60_000 });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
