import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { captureBoundaryError } from "@/lib/sentry";
import { Emblem } from "@/components/brand/Brand";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    captureBoundaryError(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-atlas-base">
        <div className="glass-strong rounded-login w-full max-w-[420px] p-8 shadow-modal text-center">
          <Emblem size={40} className="mx-auto mb-4" />
          <h1 className="text-[20px] font-semibold text-ink-1 mb-2">Something went wrong</h1>
          <p className="text-[13px] text-ink-3 mb-6">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-6 rounded-control bg-accent text-white text-[13px] font-semibold hover:brightness-110 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
