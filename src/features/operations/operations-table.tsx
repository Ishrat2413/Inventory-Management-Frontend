"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { TaskStatusBadge } from "@/components/shared/status-badges";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types";
import { Truck, CheckCircle2, Loader2, MoreHorizontal, Play, X, Eye } from "lucide-react";
import { useUpdateTask, useCompleteTask } from "@/hooks/queries/use-tasks";
import { getApiErrorMessage } from "@/lib/api-client";

import { TaskDetailDrawer } from "./task-detail-drawer";

export function OperationsTable({
  tasks,
}: {
  tasks: Task[];
}) {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();

  const handleStatusChange = (task: Task, status: "IN_PROGRESS" | "CANCELLED") => {
    updateTask.mutate(
      { id: task.id, payload: { status } },
      {
        onSuccess: () => toast.success(`Task marked as ${status.replace("_", " ").toLowerCase()}`),
        onError: (error) => toast.error("Error", { description: getApiErrorMessage(error) }),
      }
    );
  };

  const handleComplete = (task: Task) => {
    completeTask.mutate(task.id, {
      onSuccess: () => toast.success("Task completed!", { description: "Stock has been deducted." }),
      onError: (error) => toast.error("Error", { description: getApiErrorMessage(error) }),
    });
  };

  if (tasks.length === 0) {
    return <EmptyState icon={Truck} title="No tasks found" description="Try selecting a different status filter." />;
  }

  const isActioning = (id: string) =>
    (updateTask.isPending && (updateTask.variables as { id: string }).id === id) ||
    (completeTask.isPending && (completeTask.variables as string) === id);

  return (
    <>
      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelectedTask(task)}>
              <TableCell className="max-w-[220px]">
                <p className="truncate font-medium">{task.title}</p>
                {task.description && <p className="text-muted-foreground truncate text-xs">{task.description}</p>}
              </TableCell>
              <TableCell className="text-muted-foreground">{task.createdBy?.name ?? "—"}</TableCell>
              <TableCell>
                <div className="flex -space-x-2 items-center">
                  {task.assignments.slice(0, 3).map((a) => (
                    <InitialsAvatar key={a.id} name={a.employee.name ?? a.employee.email} size="size-7" className="ring-card ring-2" />
                  ))}
                  {task.assignments.length > 3 && (
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-card ring-2">
                      +{task.assignments.length - 3}
                    </span>
                  )}
                  {task.assignments.length === 0 && <span className="text-muted-foreground text-xs">Unassigned</span>}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.requiredProducts.length === 0 ? "None" : `${task.requiredProducts.length} item${task.requiredProducts.length === 1 ? "" : "s"}`}
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(task.createdAt)}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" disabled={isActioning(task.id)}>
                      {isActioning(task.id)
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <MoreHorizontal className="size-3.5" />
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                      <Eye className="size-3.5 mr-2" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {task.status === "PENDING" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "IN_PROGRESS")}>
                        <Play className="size-3.5 mr-2 text-primary" /> Mark In Progress
                      </DropdownMenuItem>
                    )}
                    {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                      <DropdownMenuItem onClick={() => handleComplete(task)}>
                        <CheckCircle2 className="size-3.5 mr-2 text-success" /> Mark Complete
                      </DropdownMenuItem>
                    )}
                    {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleStatusChange(task, "CANCELLED")}
                      >
                        <X className="size-3.5 mr-2" /> Cancel task
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
