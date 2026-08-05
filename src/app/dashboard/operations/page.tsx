"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { SectionHeader } from "@/components/shared/chart-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { useTasks } from "@/hooks/queries/use-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatusCards } from "@/features/operations/status-cards";
import { OperationsTable } from "@/features/operations/operations-table";
import { CreateTaskDialog } from "@/features/operations/create-task-dialog";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Task, TaskStatus } from "@/types";

const PAGE_SIZE = 8;

export default function OperationsPage() {
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useTasks({
    status: statusFilter === "all" ? undefined : statusFilter,
    pageNo: page,
    showPerPage: PAGE_SIZE,
  });
  const { data: pendingCounts } = useTasks({ status: "PENDING", showPerPage: 1 });
  const { data: inProgressCounts } = useTasks({ status: "IN_PROGRESS", showPerPage: 1 });
  const { data: completedCounts } = useTasks({ status: "COMPLETED", showPerPage: 1 });
  const { data: cancelledCounts } = useTasks({ status: "CANCELLED", showPerPage: 1 });

  const tasks = (data?.tasks ?? []).filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const counts: Record<TaskStatus, number> = {
    PENDING: pendingCounts?.totalData ?? 0,
    IN_PROGRESS: inProgressCounts?.totalData ?? 0,
    COMPLETED: completedCounts?.totalData ?? 0,
    CANCELLED: cancelledCounts?.totalData ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Operation status"
        description="Monitor work orders from pending to completed."
        action={<CreateTaskDialog />}
      />

      <TaskStatusCards
        counts={counts}
        active={statusFilter}
        onSelect={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
      />

      <Card className="gap-4 py-6">
        <div className="px-6">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input placeholder="Search tasks…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 px-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <OperationsTable tasks={tasks} />
        )}

        <Pagination page={page} pageCount={data?.totalPages ?? 1} onPageChange={setPage} totalItems={data?.totalData ?? 0} pageSize={PAGE_SIZE} />
      </Card>
    </div>
  );
}
