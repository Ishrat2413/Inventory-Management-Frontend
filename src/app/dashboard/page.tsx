"use client";

import { SectionHeader } from "@/components/shared/chart-card";
import { OverviewCards } from "@/features/dashboard/overview-cards";
import dynamic from "next/dynamic";
import { PendingRequestsTable } from "@/features/dashboard/pending-requests-table";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import charts since Recharts is a heavy dependency
const RevenueOverviewChart = dynamic(
  () => import("@/features/dashboard/sales-charts").then((mod) => mod.RevenueOverviewChart),
  { ssr: false, loading: () => <Skeleton className="h-100 w-full rounded-xl" /> }
);

const TopCategoriesChart = dynamic(
  () => import("@/features/dashboard/sales-charts").then((mod) => mod.TopCategoriesChart),
  { ssr: false, loading: () => <Skeleton className="h-100 w-full rounded-xl" /> }
);

const RevenueVsTargetChart = dynamic(
  () => import("@/features/dashboard/sales-charts").then((mod) => mod.RevenueVsTargetChart),
  { ssr: false, loading: () => <Skeleton className="h-100 w-full rounded-xl" /> }
);

import { LowInventoryWidget } from "@/features/dashboard/low-inventory-widget";
import { useAuthStore } from "@/store/auth-store";
import { EmployeeDashboard } from "@/features/dashboard/employee-dashboard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === "EMPLOYEE") {
    return <EmployeeDashboard />;
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here&apos;s what&apos;s happening across inventory, tasks, and requests today."
      />

      <OverviewCards />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RevenueOverviewChart />
        <TopCategoriesChart />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PendingRequestsTable />
        <LowInventoryWidget />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <RevenueVsTargetChart />
      </div>
    </div>
  );
}
