"use client";

import { Boxes, ClipboardList, DollarSign, Clock, CheckCircle2, Users, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { useProducts, useLowStockProducts } from "@/hooks/queries/use-products";
import { useTasks } from "@/hooks/queries/use-tasks";
import { useUsers } from "@/hooks/queries/use-users";
import { useSpendingReport } from "@/hooks/queries/use-reports";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function OverviewCards() {
  const { data: productsData } = useProducts({ pageNo: 1, showPerPage: 1 });
  const { data: lowStock } = useLowStockProducts();
  const { data: pendingTasks } = useTasks({ status: "PENDING", pageNo: 1, showPerPage: 1 });
  const { data: completedTasks } = useTasks({ status: "COMPLETED", pageNo: 1, showPerPage: 1 });
  const { data: employees } = useUsers({ role: "EMPLOYEE", pageNo: 1, showPerPage: 1 });
  const { data: spending } = useSpendingReport();

  const cards = [
    { label: "Total products", value: formatNumber(productsData?.totalData ?? 0), icon: Boxes, accent: "primary" as const },
    { label: "Total purchases (all-time)", value: formatCurrency(spending?.purchases.totalCost ?? 0, true), icon: DollarSign, accent: "secondary" as const },
    { label: "Cost of goods consumed", value: formatCurrency(spending?.cogs.totalCost ?? 0, true), icon: ClipboardList, accent: "accent" as const },
    { label: "Pending tasks", value: formatNumber(pendingTasks?.totalData ?? 0), icon: Clock, accent: "warning" as const },
    { label: "Completed tasks", value: formatNumber(completedTasks?.totalData ?? 0), icon: CheckCircle2, accent: "success" as const },
    { label: "Employees", value: formatNumber(employees?.totalData ?? 0), icon: Users, accent: "primary" as const },
    { label: "Low inventory", value: formatNumber(lowStock?.length ?? 0), icon: AlertTriangle, accent: "destructive" as const, helper: "Needs restocking soon" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
