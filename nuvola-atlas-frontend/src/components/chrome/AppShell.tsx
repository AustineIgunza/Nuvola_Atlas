import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SearchModal from "./SearchModal";
import MobileTabBar from "./MobileTabBar";
import ProjectQuickView from "./ProjectQuickView";
import MethodologyModal from "@/components/modals/MethodologyModal";
import { useLiveData } from "@/hooks/useLiveData";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  useLiveData();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-[var(--mobile-nav-h)] md:pb-0">{children}</main>
      </div>
      <MobileTabBar />
      <SearchModal />
      <MethodologyModal />
      <ProjectQuickView />
    </div>
  );
}
