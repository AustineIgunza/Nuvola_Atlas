import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SearchModal from "./SearchModal";
import MethodologyModal from "@/components/modals/MethodologyModal";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <SearchModal />
      <MethodologyModal />
    </div>
  );
}
