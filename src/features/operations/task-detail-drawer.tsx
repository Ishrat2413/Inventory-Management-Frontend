"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TaskStatusBadge } from "@/components/shared/status-badges";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import type { Task } from "@/types";
import { User, Package, Calendar, FileText } from "lucide-react";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function TaskDetailDrawer({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!task) return null;

  const formatDt = (dt?: string | null) => {
    if (!dt) return "—";
    try { return format(parseISO(dt), "MMM d, yyyy hh:mm a"); } catch { return "—"; }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary mt-0.5">
              <FileText className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg leading-snug">{task.title}</SheetTitle>
              <SheetDescription className="mt-1">
                <TaskStatusBadge status={task.status} />
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          {task.description && (
            <InfoRow label="Description">
              <p className="text-muted-foreground">{task.description}</p>
            </InfoRow>
          )}

          <InfoRow label="Created by">
            <div className="flex items-center gap-2">
              <InitialsAvatar name={task.createdBy?.name ?? "?"} size="size-7" />
              <span>{task.createdBy?.name ?? "Unknown"}</span>
            </div>
          </InfoRow>

          <InfoRow label="Dates">
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-3.5" />
                Created: {formatDt(task.createdAt)}
              </p>
              {task.completedBy && (
                <p className="flex items-center gap-2 text-success">
                  <Calendar className="size-3.5" />
                  Completed by: {task.completedBy.name ?? "Unknown"}
                </p>
              )}
            </div>
          </InfoRow>

          <InfoRow label={`Assigned Employees (${task.assignments.length})`}>
            {task.assignments.length === 0 ? (
              <p className="text-muted-foreground">No employees assigned</p>
            ) : (
              <div className="flex flex-col gap-2">
                {task.assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <InitialsAvatar name={a.employee.name ?? a.employee.email} size="size-8" />
                    <div>
                      <p className="text-sm font-medium">{a.employee.name ?? a.employee.email}</p>
                      {a.employee.name && <p className="text-xs text-muted-foreground">{a.employee.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoRow>

          <InfoRow label={`Required Products (${task.requiredProducts.length})`}>
            {task.requiredProducts.length === 0 ? (
              <p className="text-muted-foreground">No products required</p>
            ) : (
              <div className="flex flex-col gap-2">
                {task.requiredProducts.map((rp) => (
                  <div key={rp.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{rp.product.name}</span>
                    </div>
                    <span className="badge-primary">×{rp.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </InfoRow>
        </div>
      </SheetContent>
    </Sheet>
  );
}
