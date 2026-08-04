import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { DesktopSidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full bg-background">
        <DesktopSidebar />
        <MobileSidebar />
        <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
