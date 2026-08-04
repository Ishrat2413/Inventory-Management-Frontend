"use client";

import { AlertTriangle, PackageX } from "lucide-react";
import { ChartCard } from "@/components/shared/chart-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useLowStockProducts } from "@/hooks/queries/use-products";

export function LowInventoryWidget() {
  const { data: lowStock, isLoading } = useLowStockProducts();

  return (
    <ChartCard title="Low inventory" description="Products below threshold or currently negative">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : !lowStock || lowStock.length === 0 ? (
        <EmptyState icon={PackageX} title="Nothing running low" description="All products are sufficiently stocked." />
      ) : (
        <div className="flex flex-col gap-3">
          {lowStock.slice(0, 6).map((p) => (
            <div key={p.id} className="border-warning/25 bg-warning-soft/40 flex items-center gap-3 rounded-xl border px-3 py-2.5">
              <span className="bg-warning-soft text-warning flex size-8 shrink-0 items-center justify-center rounded-lg">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-muted-foreground text-xs">{p.sku ?? "No SKU"}</p>
              </div>
              <Badge variant={Number(p.currentStock) < 0 ? "destructive" : "warning"}>
                {Number(p.currentStock) < 0 ? `${p.currentStock} (negative)` : `${p.currentStock} left`}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
