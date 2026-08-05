"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/auth-guard";
import { DesktopSidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuthStore } from "@/store/auth-store";

const ADMIN_ONLY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/categories",
  "/dashboard/vendors",
  "/dashboard/employees",
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (user && user.role === "EMPLOYEE") {
      const isForbidden = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));
      if (isForbidden) {
        router.replace("/dashboard");
      }
    }
  }, [user, pathname, router]);

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
