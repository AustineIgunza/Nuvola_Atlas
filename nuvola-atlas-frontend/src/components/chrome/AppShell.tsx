import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import SearchModal from "./SearchModal";
import MobileTabBar from "./MobileTabBar";
import ProjectQuickView from "./ProjectQuickView";
import AnnouncementsBanner from "./AnnouncementsBanner";
import ImpersonationBanner from "./ImpersonationBanner";
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
        {/* Mobile chrome is now a floating right-edge vertical pill instead
            of a full-width bottom bar. Content pads right on <md so the
            pill never sits over active content. Safe-area handled by
            MobileTabBar itself. */}
        <main className="flex-1 overflow-y-auto pr-16 md:pr-0">{children}</main>
      </div>
      <MobileTabBar />
      <SearchModal />
      <MethodologyModal />
      <ProjectQuickView />
      <AnnouncementsBanner />
      <ImpersonationBanner />
    </div>
  );
}
