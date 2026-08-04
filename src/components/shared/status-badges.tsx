import { Badge } from "@/components/ui/badge";
import type { TaskStatus, ProductRequestStatus } from "@/types";

const taskStatusMap: Record<TaskStatus, { label: string; variant: "warning" | "secondary" | "success" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  IN_PROGRESS: { label: "In progress", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = taskStatusMap[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const requestStatusMap: Record<ProductRequestStatus, { label: string; variant: "warning" | "success" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function RequestStatusBadge({ status }: { status: ProductRequestStatus }) {
  const s = requestStatusMap[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Product stock status is derived from currentStock vs. lowStockThreshold — the backend has no stored status field. */
export function ProductStockBadge({ currentStock, lowStockThreshold }: { currentStock: number; lowStockThreshold: number | null }) {
  if (currentStock < 0) return <Badge variant="destructive">Negative stock</Badge>;
  if (currentStock === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (lowStockThreshold !== null && currentStock <= lowStockThreshold) return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">In stock</Badge>;
}

export function EmployeeActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "success" : "muted"}>{isActive ? "Active" : "Deactivated"}</Badge>;
}
