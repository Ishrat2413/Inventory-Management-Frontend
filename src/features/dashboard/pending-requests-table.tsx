"use client";

import { ChartCard } from "@/components/shared/chart-card";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useProductRequests } from "@/hooks/queries/use-product-requests";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

export function PendingRequestsTable() {
  const { data, isLoading } = useProductRequests({ status: "PENDING", showPerPage: 6 });
  const requests = data?.requests ?? [];

  return (
    <ChartCard title="Pending product requests" description="Awaiting admin approval" className="xl:col-span-2">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No pending requests" description="All product requests have been reviewed." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.product.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <InitialsAvatar name={r.requestedBy.name ?? "Unknown"} size="size-7" />
                    <span className="text-sm">{r.requestedBy.name}</span>
                  </div>
                </TableCell>
                <TableCell className="tabular">{r.quantity}</TableCell>
                <TableCell>
                  <Badge variant={r.type === "TASK_RELATED" ? "secondary" : "muted"}>{r.type === "TASK_RELATED" ? "Task" : "General"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ChartCard>
  );
}
