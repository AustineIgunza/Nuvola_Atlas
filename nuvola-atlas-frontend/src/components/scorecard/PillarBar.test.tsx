// jest-dom is a devDependency but vitest.config.ts has `setupFiles: []`, so
// its matchers have to be pulled in per file.
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PillarBar from "./PillarBar";

describe("PillarBar estimated state", () => {
  it("marks a synthesised score and withholds its delta", () => {
    render(<PillarBar pillarKey="social" score={64} delta={3} index={0} estimated />);

    expect(screen.getByLabelText(/estimated — no measured data/i)).toHaveTextContent("64");
    expect(screen.queryByText("+3")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a measured score unmarked, with its delta", () => {
    render(<PillarBar pillarKey="social" score={64} delta={3} index={0} />);

    expect(screen.queryByLabelText(/estimated/i)).not.toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("shows no movement for an unmeasured delta rather than a flat zero", () => {
    render(<PillarBar pillarKey="social" score={64} delta={null} index={0} />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    // The score itself was measured, so it must not pick up the estimated mark.
    expect(screen.queryByLabelText(/estimated/i)).not.toBeInTheDocument();
  });

  it("keeps a genuine no-change reading distinct from an unmeasured one", () => {
    render(<PillarBar pillarKey="social" score={64} delta={0} index={0} />);

    expect(screen.getByText("+0")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("shows an unmeasured pillar as a dash and draws no bar fill", () => {
    const { container } = render(
      <PillarBar pillarKey="social" score={null} delta={null} index={0} />,
    );

    // Two dashes: one for the score, one for the delta. Neither is an
    // estimated mark — a null score is unmeasured, not synthesised.
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByLabelText(/estimated/i)).not.toBeInTheDocument();
    // The bar track is present; the animated coloured fill inside it is not.
    // The pillar glyph badge shares a box-shadow style so it cannot be the
    // selector — the animated fill is a direct child of the .overflow-hidden
    // track, so check that specifically.
    const track = container.querySelector(".overflow-hidden");
    expect(track).not.toBeNull();
    expect(track?.children.length).toBe(0);
  });
});
