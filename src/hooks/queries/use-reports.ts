"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { reportsService } from "@/services/reports.service";

/** Fetches the last `months` months (oldest → newest) for a purchases/COGS trend chart. */
export function useMonthlyTrend(months = 6) {
  const now = new Date();
  const periods = Array.from({ length: months }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const results = useQueries({
    queries: periods.map((p) => ({
      queryKey: ["reports", "monthly", p.year, p.month],
      queryFn: () => reportsService.monthly(p.year, p.month),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const data = periods.map((p, i) => ({
    label: new Date(p.year, p.month - 1, 1).toLocaleString("en-US", { month: "short" }),
    purchases: results[i].data?.totalPurchases ?? 0,
    cogs: results[i].data?.totalCogs ?? 0,
  }));

  return { data, isLoading };
}

export function useSpendingReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["reports", "spending", params],
    queryFn: () => reportsService.spending(params),
  });
}

export function useCogsReport(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["reports", "cogs", params],
    queryFn: () => reportsService.cogs(params),
  });
}

export function useInventoryValueReport() {
  return useQuery({
    queryKey: ["reports", "inventory-value"],
    queryFn: () => reportsService.inventoryValue(),
  });
}

export function useLowStockReport() {
  return useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: () => reportsService.lowStock(),
  });
}
