import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { ToastViewport } from "@/components/ui/Toast";

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <Outlet />
          <Footer />
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}
