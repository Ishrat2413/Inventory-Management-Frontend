"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { EmployeeActiveBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDeactivateUser } from "@/hooks/queries/use-users";
import { getApiErrorMessage } from "@/lib/api-client";
import type { User } from "@/types";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useQueryClient } from "@tanstack/react-query";

export function EmployeeTable({ employees }: { employees: User[] }) {
  const deactivateUser = useDeactivateUser();
  const queryClient = useQueryClient();

  const currentUser = useAuthStore((s) => s.user);

  if (employees.length === 0) {
    return <EmptyState icon={Users} title="No users found" description="Add your first user to get started." />;
  }

  const handleDeactivate = (employee: User) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${employee.name || employee.email}"? This will also remove their attendance and tasks from the database.`
      )
    ) {
      return;
    }
    deactivateUser.mutate(employee.id, {
      onSuccess: () => {
        toast.success("User deleted", { description: `${employee.name ?? employee.email} was removed.` });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
      onError: (error) => toast.error("Couldn't delete user", { description: getApiErrorMessage(error) }),
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Pay rate</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((e) => {
          const profile = e.employeeProfile;
          const payLabel = profile
            ? profile.payCalculationMode === "HOURLY"
              ? `${formatCurrency(Number(profile.hourlyRate))}/hr`
              : `${formatCurrency(Number(profile.dailyRate ?? 0))}/day`
            : "—";
          return (
            <TableRow key={e.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={e.name ?? e.email} />
                  <div className="flex flex-col">
                    <span className="font-medium">{e.name ?? "—"}</span>
                    <span className="text-muted-foreground text-xs">{e.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={e.role === "ADMIN" ? "default" : "outline"} className="capitalize">
                  {e.role.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{profile?.department ?? "—"}</TableCell>
              <TableCell className="tabular">{payLabel}</TableCell>
              <TableCell className="text-muted-foreground">{profile?.joinDate ? formatDate(profile.joinDate) : formatDate(e.createdAt)}</TableCell>
              <TableCell>
                <EmployeeActiveBadge isActive={e.isActive} />
              </TableCell>
              <TableCell className="text-right">
                {e.id !== currentUser?.id && (
                  <Button variant="ghost" size="icon-sm" className="text-destructive cursor-pointer" onClick={() => handleDeactivate(e)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
