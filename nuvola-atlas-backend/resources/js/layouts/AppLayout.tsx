import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "../components/chrome/Sidebar";
import TopBar from "../components/chrome/TopBar";
import SearchModal from "../components/chrome/SearchModal";
import MethodologyModal from "../components/modals/MethodologyModal";
import { useUIStore } from "../stores/ui";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initDarkMode = useUIStore((s) => s.initDarkMode);

  useEffect(() => {
    initDarkMode();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-surface text-ink transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <SearchModal />
        <MethodologyModal />
      </div>
    </QueryClientProvider>
  );
}
