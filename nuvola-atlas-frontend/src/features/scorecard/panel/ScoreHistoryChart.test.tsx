import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoryRange } from "@/domain/types";
import ScoreHistoryChart from "./ScoreHistoryChart";

const getZoneHistory = vi.fn();

vi.mock("@/api", () => ({
  api: {
    getZoneHistory: (id: string, range: HistoryRange) => getZoneHistory(id, range),
    getZoneForecast: () => Promise.resolve({ points: [] }),
  },
}));

function pointsEndingAt(iso: string, count: number) {
  const end = new Date(iso).getTime();
  return Array.from({ length: count }, (_, i) => ({
    t: new Date(end - (count - 1 - i) * 86_400_000).toISOString(),
    score: 70 + i,
    pillars: { social: 70, safety: 70, density: 70, infra: 70 },
  }));
}

function renderChart() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ScoreHistoryChart zoneId="westlands" />
    </QueryClientProvider>,
  );
}

describe("ScoreHistoryChart empty states", () => {
  beforeEach(() => getZoneHistory.mockReset());

  it("does not claim absence when a wider window still holds history", async () => {
    // A stalled feed empties the 7-day window first while a month of
    // snapshots is still on record — the panel must not report "no history".
    getZoneHistory.mockImplementation((_id: string, range: HistoryRange) =>
      Promise.resolve(
        range === "month"
          ? { range, points: pointsEndingAt("2026-08-08T09:00:00Z", 20) }
          : { range, points: [] },
      ),
    );

    renderChart();

    expect(await screen.findByText(/No snapshots in the last 7 days/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Show last 30 days/ })).toBeTruthy();
    expect(screen.queryByText(/No history recorded for this zone yet/)).toBeNull();
  });

  it("reports no history only once the widest window is also empty", async () => {
    getZoneHistory.mockResolvedValue({ range: "week", points: [] });

    renderChart();

    expect(await screen.findByText(/No history recorded for this zone yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Show last 30 days/ })).toBeNull();
  });
});
