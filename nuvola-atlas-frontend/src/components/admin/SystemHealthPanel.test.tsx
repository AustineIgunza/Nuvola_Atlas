// jest-dom is a devDependency but vitest.config.ts has `setupFiles: []`, so
// its matchers have to be pulled in per file.
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SystemHealth } from "@/api/admin";
import SystemHealthPanel from "./SystemHealthPanel";

const systemHealth = vi.fn();

vi.mock("@/api/admin", () => ({
  adminApi: { systemHealth: () => systemHealth() },
}));

function renderPanel(payload: SystemHealth) {
  systemHealth.mockResolvedValue(payload);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <SystemHealthPanel />
    </QueryClientProvider>,
  );
}

describe("SystemHealthPanel", () => {
  it("renders an unmeasurable value as a dash, never as a number", async () => {
    renderPanel({
      measured_at: new Date().toISOString(),
      checks: [
        {
          key: "uptime_30d",
          status: "not_monitored",
          value: null,
          unit: null,
          detail: "Needs an external prober.",
        },
      ],
    });

    const card = await screen.findByTestId("health-uptime_30d");
    expect(within(card).getByText("—")).toBeInTheDocument();
    expect(within(card).getByText(/not monitored/i)).toBeInTheDocument();
    // The old panel printed "99.98%" here.
    expect(within(card).queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders a measured value with its unit and no not-monitored label", async () => {
    renderPanel({
      measured_at: new Date().toISOString(),
      checks: [
        {
          key: "database",
          status: "ok",
          value: 3.14,
          unit: "ms",
          detail: "Median of 5 SELECT 1 round-trips sampled now, driver pgsql.",
        },
      ],
    });

    const card = await screen.findByTestId("health-database");
    expect(within(card).getByText("3.14 ms")).toBeInTheDocument();
    expect(within(card).queryByText(/not monitored/i)).not.toBeInTheDocument();
  });

  it("surfaces a failure instead of rendering a healthy-looking panel", async () => {
    systemHealth.mockRejectedValue(new Error("403 Forbidden"));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    render(
      <QueryClientProvider client={client}>
        <SystemHealthPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/could not read system health/i)).toBeInTheDocument();
  });
});
