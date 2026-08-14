import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <Sidebar isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar isAdmin={isAdmin} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
