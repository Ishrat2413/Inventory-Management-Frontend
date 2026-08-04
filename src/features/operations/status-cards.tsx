"use client";

import { Clock, Loader, PackageCheck, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Clock; accent: string }> = {
  PENDING: { label: "Pending", icon: Clock, accent: "text-warning bg-warning-soft" },
  IN_PROGRESS: { label: "In progress", icon: Loader, accent: "text-secondary bg-secondary-soft" },
  COMPLETED: { label: "Completed", icon: PackageCheck, accent: "text-success bg-success-soft" },
  CANCELLED: { label: "Cancelled", icon: XCircle, accent: "text-destructive bg-destructive-soft" },
};

export function TaskStatusCards({
  counts,
  active,
  onSelect,
}: {
  counts: Record<TaskStatus, number>;
  active: TaskStatus | "all";
  onSelect: (status: TaskStatus | "all") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status, i) => {
        const config = STATUS_CONFIG[status];
        const isActive = active === status;
        return (
          <motion.button
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            onClick={() => onSelect(isActive ? "all" : status)}
            className="text-left"
          >
            <Card className={cn("cursor-pointer gap-3 py-4 transition-all hover:-translate-y-0.5", isActive && "ring-primary ring-2")}>
              <div className="flex items-center justify-between px-4">
                <span className={cn("flex size-9 items-center justify-center rounded-xl", config.accent)}>
                  <config.icon className="size-4.5" />
                </span>
              </div>
              <div className="px-4">
                <p className="tabular text-xl font-semibold">{counts[status] ?? 0}</p>
                <p className="text-muted-foreground text-xs">{config.label}</p>
              </div>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}
