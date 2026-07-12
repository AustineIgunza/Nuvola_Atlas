import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import SearchModal from "./SearchModal";
import MobileTabBar from "./MobileTabBar";
import ProjectQuickView from "./ProjectQuickView";
import MethodologyModal from "@/components/modals/MethodologyModal";
import { useLiveData } from "@/hooks/useLiveData";
import { useChromeStore } from "@/stores/chrome";

interface Props {
  children: React.ReactNode;
}

/**
 * The persistent shell. Sidebar floats over the content — on Atlas the map
 * bleeds all the way behind it, on every other route the main column pads
 * left just enough to keep text content out from under the panel.
 *
 * Widths match the aside in Sidebar.tsx (244 / 64) plus a 12 px gutter.
 */
export default function AppShell({ children }: Props) {
  useLiveData();
  const location = useLocation();
  const collapsed = useChromeStore((s) => s.sidebarCollapsed);
  const isAtlas = location.pathname === "/atlas";
  // Atlas gets no padding so the map extends edge-to-edge behind the
  // floating sidebar. Every other page pads left so its content clears
  // the sidebar.
  const inset = isAtlas ? "" : collapsed ? "md:pl-[76px]" : "md:pl-[256px]";
  return (
    <div className="min-h-screen relative">
      <Sidebar />
      <div className={`flex flex-col min-w-0 min-h-screen ${inset}`}>
        <main className="flex-1 overflow-y-auto pb-[var(--mobile-nav-h)] md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
      <SearchModal />
      <MethodologyModal />
      <ProjectQuickView />
    </div>
  );
}
