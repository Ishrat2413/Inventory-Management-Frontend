"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { useAttendanceList } from "@/hooks/queries/use-users";

export function TodayAttendanceWidget() {
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data, isLoading } = useAttendanceList({ from: today, to: today, showPerPage: 10 });

  const records = data?.records ?? [];

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Today&apos;s Attendance
          </CardTitle>
          <CardDescription>Real-time employee check-in/out log.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <p className="text-sm">No check-ins today yet</p>
              <p className="text-xs mt-1">Employees will appear here once they check in.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-75 overflow-y-auto pr-1">
              {records.map((record) => {
                const checkInTime = record.checkIn ? format(parseISO(record.checkIn), "hh:mm a") : null;
                const checkOutTime = record.checkOut ? format(parseISO(record.checkOut), "hh:mm a") : null;

                return (
                  <div key={record.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={record.employee?.name || record.employee?.email || "Employee"} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{record.employee?.name || "Employee"}</span>
                        <span className="text-xs text-muted-foreground">{record.employee?.email || ""}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {checkInTime && (
                        <span className="text-xs font-medium flex items-center gap-1 text-success bg-success-soft px-1.5 py-0.5 rounded">
                          <LogIn className="size-3" />
                          {checkInTime}
                        </span>
                      )}
                      {checkOutTime ? (
                        <span className="text-xs font-medium flex items-center gap-1 text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                          <LogOut className="size-3" />
                          {checkOutTime}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 font-semibold animate-pulse">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
