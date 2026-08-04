"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { TaskStatusBadge } from "@/components/shared/status-badges";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types";
import { Truck, CheckCircle2, Loader2 } from "lucide-react";

export function OperationsTable({
  tasks,
  onComplete,
  completingId,
}: {
  tasks: Task[];
  onComplete: (task: Task) => void;
  completingId?: string;
}) {
  if (tasks.length === 0) {
    return <EmptyState icon={Truck} title="No tasks found" description="Try selecting a different status filter." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Created by</TableHead>
          <TableHead>Assigned to</TableHead>
          <TableHead>Products required</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="max-w-[220px]">
              <p className="truncate font-medium">{task.title}</p>
              {task.description && <p className="text-muted-foreground truncate text-xs">{task.description}</p>}
            </TableCell>
            <TableCell className="text-muted-foreground">{task.createdBy?.name ?? "—"}</TableCell>
            <TableCell>
              <div className="flex -space-x-2">
                {task.assignments.slice(0, 3).map((a) => (
                  <InitialsAvatar key={a.id} name={a.employee.name ?? a.employee.email} size="size-7" className="ring-card ring-2" />
                ))}
                {task.assignments.length === 0 && <span className="text-muted-foreground text-xs">Unassigned</span>}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {task.requiredProducts.length} product{task.requiredProducts.length === 1 ? "" : "s"}
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(task.createdAt)}</TableCell>
            <TableCell className="text-right">
              {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                <Button variant="soft" size="sm" onClick={() => onComplete(task)} disabled={completingId === task.id}>
                  {completingId === task.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Complete
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
