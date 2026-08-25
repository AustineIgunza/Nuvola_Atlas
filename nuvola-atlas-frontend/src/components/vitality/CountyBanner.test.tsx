import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import CountyBanner from "./CountyBanner";
import type { CountyContextReading } from "@/types";

vi.mock("@/api", () => ({
  api: { getCountyContext: vi.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { api } = await import("@/api");
const mockedGetCountyContext = vi.mocked(api.getCountyContext);

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const reading = (over: Partial<CountyContextReading> = {}): CountyContextReading => ({
  county: "Nairobi",
  pillarKey: "water_sanitation",
  indicatorKey: "non_revenue_water",
  value: 48.0,
  unit: "%",
  granularity: "utility",
  method: "measured",
  sourceId: "wasreb_impact_17",
  vintage: "FY2023/24",
  retrieved: "2026-08-24",
  extractionConfidence: "high",
  pageRef: null,
  notes: null,
  ...over,
});

describe("CountyBanner", () => {
  beforeEach(() => {
    mockedGetCountyContext.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the county-wide chip and one row per measured indicator", async () => {
    mockedGetCountyContext.mockResolvedValueOnce([
      reading(),
      reading({
        indicatorKey: "hours_of_supply",
        value: 7.0,
        unit: "hrs/day",
      }),
    ]);

    render(<CountyBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/nairobi county/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/county-wide/i)).toBeInTheDocument();
    expect(screen.getByText("Non-revenue water")).toBeInTheDocument();
    expect(screen.getByText("48%")).toBeInTheDocument();
    expect(screen.getByText("Hours of supply")).toBeInTheDocument();
    expect(screen.getByText("7 hrs/day")).toBeInTheDocument();
    // Source attribution renders inline, not as an optional prop.
    expect(screen.getAllByText(/WASREB IMPACT 17 · FY2023\/24/)[0]).toBeInTheDocument();
  });

  it("renders a gap row with 'Not measured' and no number", async () => {
    mockedGetCountyContext.mockResolvedValueOnce([
      reading({ method: "gap", value: null }),
    ]);

    render(<CountyBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Not measured")).toBeInTheDocument();
    });
    // No stray zero rendered — a gap is a gap, never a 0.
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("returns null while the query is loading", () => {
    // Never-resolving promise mimics an in-flight fetch.
    mockedGetCountyContext.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<CountyBanner />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it("returns null when the api yields an empty list", async () => {
    mockedGetCountyContext.mockResolvedValueOnce([]);

    const { container } = render(<CountyBanner />, { wrapper });
    await waitFor(() => {
      // After settlement, still nothing to render.
      expect(container.firstChild).toBeNull();
    });
  });

  it("refuses to render a subcounty payload even if the server sends one", async () => {
    // A regression guard — the server contract is that county_context
    // rows are county/utility/national. If a bug leaks a subcounty row,
    // the banner must filter it out rather than paint it county-wide.
    mockedGetCountyContext.mockResolvedValueOnce([
      reading({
        // Cast to bypass the type — this is exactly the invalid payload
        // shape the test is guarding against.
        granularity: "subcounty" as unknown as "utility",
      }),
    ]);

    const { container } = render(<CountyBanner />, { wrapper });
    // The rows are filtered out; with no rows left the banner returns null.
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("passes the county prop through to the api", async () => {
    mockedGetCountyContext.mockResolvedValueOnce([reading({ county: "Mombasa" })]);

    render(<CountyBanner county="Mombasa" />, { wrapper });

    await waitFor(() => {
      expect(mockedGetCountyContext).toHaveBeenCalledWith("Mombasa");
    });
  });
});
