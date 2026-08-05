"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  CalendarCheck, Clock, CheckCircle2, Play, AlertTriangle, PlayCircle, Loader2, ArrowRight, ClipboardList, CheckCircle, XCircle
} from "lucide-react";
import { useMyTodayAttendance, useCheckIn, useCheckOut } from "@/hooks/queries/use-attendance";
import { useTasks, useUpdateTask, useCompleteTask } from "@/hooks/queries/use-tasks";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TaskStatusBadge } from "@/components/shared/status-badges";
import { getApiErrorMessage } from "@/lib/api-client";
import { TaskDetailDrawer } from "@/features/operations/task-detail-drawer";
import type { Task } from "@/types";

export function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  // Queries
  const { data: attendance, isLoading: attendanceLoading } = useMyTodayAttendance();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ pageNo: 1, showPerPage: 5 });

  // Mutations
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();

  const tasks = tasksData?.tasks ?? [];

  const handleCheckIn = () => {
    checkInMutation.mutate(undefined, {
      onSuccess: () => toast.success("Checked in successfully!", { description: "Have a great day at work!" }),
      onError: (err) => toast.error("Check-in failed", { description: getApiErrorMessage(err) }),
    });
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate(undefined, {
      onSuccess: () => toast.success("Checked out successfully!", { description: "See you next time!" }),
      onError: (err) => toast.error("Check-out failed", { description: getApiErrorMessage(err) }),
    });
  };

  const handleStartTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate(
      { id: task.id, payload: { status: "IN_PROGRESS" } },
      {
        onSuccess: () => toast.success("Task started!"),
        onError: (err) => toast.error("Error starting task", { description: getApiErrorMessage(err) }),
      }
    );
  };

  const handleCompleteTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask.mutate(task.id, {
      onSuccess: () => toast.success("Task completed!", { description: "Refill stock has been deducted." }),
      onError: (err) => toast.error("Error completing task", { description: getApiErrorMessage(err) }),
    });
  };

  const isMutating = checkInMutation.isPending || checkOutMutation.isPending || updateTask.isPending || completeTask.isPending;

  return (
    <div className="flex flex-col gap-6">
      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />

      {/* Hero Welcome banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary-soft to-accent-soft p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back, {user?.name || user?.email || "Employee"}! 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl">
          Here is your work center. You can manage your today&apos;s attendance and view tasks assigned to you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Attendance Card */}
        <Card className="md:col-span-1 shadow-sm border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarCheck className="size-5 text-primary" />
              Today&apos;s Attendance
            </CardTitle>
            <CardDescription>Record your check-in and check-out times.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Status Indicator */}
                <div className="rounded-xl bg-muted/40 p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
                      <Clock className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Status</p>
                      <p className="text-sm font-semibold">
                        {!attendance?.checkInTime
                          ? "Not Checked In"
                          : !attendance?.checkOutTime
                          ? "Working (Checked In)"
                          : "Finished (Checked Out)"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-xs border-t border-border/60 pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="font-medium tabular">
                        {attendance?.checkInTime ? format(parseISO(attendance.checkInTime), "hh:mm a") : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out:</span>
                      <span className="font-medium tabular">
                        {attendance?.checkOutTime ? format(parseISO(attendance.checkOutTime), "hh:mm a") : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Check In / Out Buttons */}
                <div className="flex flex-col gap-2">
                  {!attendance?.checkInTime ? (
                    <Button
                      size="lg"
                      onClick={handleCheckIn}
                      disabled={isMutating}
                      className="w-full bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
                    >
                      {checkInMutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                      Check In Today
                    </Button>
                  ) : !attendance?.checkOutTime ? (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleCheckOut}
                      disabled={isMutating}
                      className="w-full cursor-pointer"
                    >
                      {checkOutMutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                      Check Out Today
                    </Button>
                  ) : (
                    <div className="rounded-xl border border-success-soft bg-success-soft/20 p-3.5 text-center text-xs text-success font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="size-4.5 shrink-0" />
                      Attendance complete for today!
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assigned Tasks Card */}
        <Card className="md:col-span-2 shadow-sm border border-border">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="size-5 text-primary" />
                Assigned Tasks
              </CardTitle>
              <CardDescription>Work orders assigned to you by administrators.</CardDescription>
            </div>
            <a href="/dashboard/operations" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="size-3" />
            </a>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {tasksLoading ? (
              <div className="flex flex-col gap-2 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 w-full bg-muted/40 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No tasks assigned</p>
                <p className="text-xs text-muted-foreground">You don&apos;t have any active work orders.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {task.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                      <TaskStatusBadge status={task.status} />

                      {task.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleStartTask(task, e)}
                          disabled={isMutating}
                          className="h-8 text-xs cursor-pointer"
                        >
                          <Play className="size-3 mr-1" /> Start
                        </Button>
                      )}

                      {task.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          onClick={(e) => handleCompleteTask(task, e)}
                          disabled={isMutating}
                          className="h-8 text-xs bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
                        >
                          <CheckCircle2 className="size-3 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
