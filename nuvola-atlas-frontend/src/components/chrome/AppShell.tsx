import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import SearchModal from "./SearchModal";
import MobileTabBar from "./MobileTabBar";
import ProjectQuickView from "./ProjectQuickView";
import AnnouncementsBanner from "./AnnouncementsBanner";
import ImpersonationBanner from "./ImpersonationBanner";
import MethodologyModal from "@/components/modals/MethodologyModal";
import ESGLensChip from "@/components/investor/ESGLensChip";
import { useLiveData } from "@/hooks/useLiveData";
import { useChromeStore } from "@/stores/chrome";

// Investor ESG-lens chip only surfaces on the scorecard-adjacent pages
// where the reordering actually pays off. On other pages (Reports,
// Assistant, Settings, Admin) the toggle would be confusing chrome.
const ESG_LENS_ROUTES = new Set(["/atlas", "/vitality", "/compare"]);

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
  const showEsgLens = ESG_LENS_ROUTES.has(location.pathname);
  // Atlas gets no padding so the map extends edge-to-edge behind the
  // floating sidebar. Every other page pads left so its content clears
  // the sidebar.
  const inset = isAtlas ? "" : collapsed ? "md:pl-[76px]" : "md:pl-[256px]";
  return (
    <div className="min-h-screen relative">
      <Sidebar />
      <div className={`flex flex-col min-w-0 min-h-screen ${inset}`}>
        {/* Mobile chrome is now a floating right-edge vertical pill instead
            of a full-width bottom bar. Text-content pages pad right on <md
            so the pill never sits over active content; the Atlas map bleeds
            edge-to-edge because the pill has its own glass background and
            the 64 px reserved strip would otherwise crop the map. Safe-area
            handled by MobileTabBar itself. */}
        <main className={`flex-1 ${isAtlas ? "overflow-hidden" : "overflow-y-auto pr-16 md:pr-0"}`}>
          {children}
        </main>
      </div>
      <MobileTabBar />
      <SearchModal />
      <MethodologyModal />
      <ProjectQuickView />
      <AnnouncementsBanner />
      <ImpersonationBanner />
      {showEsgLens && (
        // Floating top-right — high enough to clear the mobile pill and
        // stays out of the Atlas compass column (compass is at right-3;
        // this chip is right-16 on Atlas so both fit, right-3 elsewhere).
        <div
          className={`fixed z-30 top-3 ${isAtlas ? "right-16" : "right-16 md:right-6"}`}
          data-testid="esg-lens-mount"
        >
          <ESGLensChip />
        </div>
      )}
    </div>
  );
}
