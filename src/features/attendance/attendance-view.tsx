"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  UserX,
  UserCheck
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isToday,
  isFuture
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAttendance, useOverrideAttendance } from "@/hooks/queries/use-attendance";
import { useUsers } from "@/hooks/queries/use-users";
import { getApiErrorMessage } from "@/lib/api-client";
import type { AttendanceRecord } from "@/services/attendance.service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { InitialsAvatar } from "@/components/shared/initials-avatar";

function formatTime(dt?: string | null) {
  if (!dt) return "—";
  try {
    return format(parseISO(dt), "hh:mm a");
  } catch {
    return "—";
  }
}

function formatDuration(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return "—";
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  } catch {
    return "—";
  }
}

function OverrideDialog({
  open,
  onOpenChange,
  record,
  selectedDate,
  userId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: AttendanceRecord;
  selectedDate: string;
  userId: string;
}) {
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const override = useOverrideAttendance();

  React.useEffect(() => {
    if (open) {
      if (record) {
        setCheckIn(record.checkInTime ? format(parseISO(record.checkInTime), "HH:mm") : "");
        setCheckOut(record.checkOutTime ? format(parseISO(record.checkOutTime), "HH:mm") : "");
        setNotes(record.notes || "");
      } else {
        setCheckIn("");
        setCheckOut("");
        setNotes("");
      }
    }
  }, [open, record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toISO = (time: string) => (time ? `${selectedDate}T${time}:00.000Z` : undefined);

    override.mutate(
      {
        userId: record?.userId || userId,
        date: selectedDate,
        checkInTime: toISO(checkIn),
        checkOutTime: toISO(checkOut),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Attendance record updated successfully!");
          onOpenChange(false);
        },
        onError: (error) => toast.error("Error updating attendance", { description: getApiErrorMessage(error) }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Override Attendance</DialogTitle>
          <DialogDescription>Manually update check-in/out times for this employee.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="att-checkin">Check-in time</Label>
              <Input id="att-checkin" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="att-checkout">Check-out time</Label>
              <Input id="att-checkout" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-notes">Notes (optional)</Label>
            <Input id="att-notes" placeholder="Reason for override..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={override.isPending}>
              {override.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Save override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AttendanceView() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  // Common State
  const [selectedDate, setSelectedDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [overrideOpen, setOverrideOpen] = React.useState(false);
  const [overrideRecord, setOverrideRecord] = React.useState<AttendanceRecord | undefined>();
  const [targetEmployeeId, setTargetEmployeeId] = React.useState("");

  // Employee Calendar Navigation State
  const [currentYear, setCurrentYear] = React.useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date().getMonth()); // 0-indexed

  // Calculate first and last day of month for employee month query
  const startOfSelectedMonth = React.useMemo(() => {
    return startOfMonth(new Date(currentYear, currentMonth, 1));
  }, [currentYear, currentMonth]);

  const endOfSelectedMonth = React.useMemo(() => {
    return endOfMonth(new Date(currentYear, currentMonth, 1));
  }, [currentYear, currentMonth]);

  // Query Params based on Role
  const queryParams = React.useMemo(() => {
    if (isAdmin) {
      // Admin queries single day
      return { from: selectedDate, to: selectedDate, showPerPage: 200 };
    } else {
      // Employee queries full month
      return {
        from: format(startOfSelectedMonth, "yyyy-MM-dd"),
        to: format(endOfSelectedMonth, "yyyy-MM-dd"),
        showPerPage: 100,
      };
    }
  }, [isAdmin, selectedDate, startOfSelectedMonth, endOfSelectedMonth]);

  // Queries
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance(queryParams);
  const { data: usersData, isLoading: usersLoading } = useUsers({
    role: "EMPLOYEE",
    showPerPage: 200,
    isActive: true,
  }, { enabled: isAdmin });

  const records = attendanceData?.records ?? [];
  const employees = usersData?.users ?? [];

  // Admin stats computation
  const activeCheckIns = React.useMemo(() => {
    return records.filter((r) => r.checkInTime && !r.checkOutTime).length;
  }, [records]);

  const checkedOutCount = React.useMemo(() => {
    return records.filter((r) => r.checkInTime && r.checkOutTime).length;
  }, [records]);

  const presentCount = activeCheckIns + checkedOutCount;
  const absentCount = Math.max(0, employees.length - presentCount);

  // Handlers for Admin Date navigation
  const changeAdminDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  // Handlers for Employee Month Navigation
  const changeEmployeeMonth = (offset: number) => {
    const d = new Date(currentYear, currentMonth + offset, 1);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  // Generate calendar grid array
  const calendarDays = React.useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDayIndex = startOfSelectedMonth.getDay(); // 0 for Sunday
    const totalDays = endOfSelectedMonth.getDate();

    // Fill previous month blank cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Fill current month cells
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return days;
  }, [currentYear, currentMonth, startOfSelectedMonth, endOfSelectedMonth]);

  const yearsList = React.useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => base - 2 + i);
  }, []);

  const monthsList = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        {/* Admin Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-center gap-4 stat-card">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
              <UserCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Present / Checked In</p>
              <p className="text-2xl font-bold tabular">{attendanceLoading ? "—" : presentCount}</p>
            </div>
          </div>
          <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-center gap-4 stat-card">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Currently Working</p>
              <p className="text-2xl font-bold tabular">{attendanceLoading ? "—" : activeCheckIns}</p>
            </div>
          </div>
          <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-center gap-4 stat-card">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
              <UserX className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">No Attendance (Absent)</p>
              <p className="text-2xl font-bold tabular">{attendanceLoading || usersLoading ? "—" : absentCount}</p>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => changeAdminDate(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="date"
              className="w-auto h-9"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => changeAdminDate(1)}
              disabled={selectedDate >= format(new Date(), "yyyy-MM-dd")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Showing records for: <span className="text-foreground">{format(parseISO(selectedDate), "PPPP")}</span>
          </div>
        </div>

        {/* Override Dialog for Admin */}
        <OverrideDialog
          open={overrideOpen}
          onOpenChange={setOverrideOpen}
          record={overrideRecord}
          selectedDate={selectedDate}
          userId={targetEmployeeId}
        />

        {/* Admin Attendance Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {attendanceLoading || usersLoading ? (
            <div className="p-4 flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No Employees Found</p>
              <p className="text-xs text-muted-foreground">Add employees first to check their attendance status.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Check-in</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Check-out</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((employee) => {
                  const record = records.find((r) => r.userId === employee.id);
                  const isCheckedIn = !!record?.checkInTime;
                  const isCheckedOut = !!record?.checkOutTime;

                  let statusText = "Absent (No Attendance)";
                  let statusClass = "badge-destructive";

                  if (isCheckedIn) {
                    if (isCheckedOut) {
                      statusText = record?.isLate ? "Late" : "Checked Out";
                      statusClass = record?.isLate ? "badge-warning" : "badge-success";
                    } else {
                      statusText = "Checked In";
                      statusClass = "badge-primary";
                    }
                  }

                  return (
                    <tr
                      key={employee.id}
                      className={cn("hover:bg-muted/30 transition-colors", !isCheckedIn && "opacity-60")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={employee.name || employee.email} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{employee.name || "Employee"}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusClass}>{statusText}</span>
                      </td>
                      <td className="px-4 py-3 tabular text-muted-foreground">
                        {record?.checkInTime ? formatTime(record.checkInTime) : "—"}
                      </td>
                      <td className="px-4 py-3 tabular text-muted-foreground">
                        {record?.checkOutTime ? formatTime(record.checkOutTime) : "—"}
                      </td>
                      <td className="px-4 py-3 tabular text-muted-foreground">
                        {record?.checkInTime && record?.checkOutTime
                          ? formatDuration(record.checkInTime, record.checkOutTime)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 cursor-pointer"
                          onClick={() => {
                            setOverrideRecord(record);
                            setTargetEmployeeId(employee.id);
                            setOverrideOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Employee Calendar View
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      {/* Month Navigation Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => changeEmployeeMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Select
            value={currentMonth.toString()}
            onValueChange={(val) => setCurrentMonth(parseInt(val, 10))}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {monthsList.map((m, idx) => (
                <SelectItem key={m} value={idx.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentYear.toString()}
            onValueChange={(val) => setCurrentYear(parseInt(val, 10))}
          >
            <SelectTrigger className="w-28 h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearsList.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="icon" variant="outline" onClick={() => changeEmployeeMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="text-sm font-semibold text-primary">
          {monthsList[currentMonth]} {currentYear}
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="rounded-xl border border-border bg-card p-4">
        {attendanceLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <TooltipProvider>
            <div className="flex flex-col gap-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2 pt-2">
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="bg-muted/10 rounded-lg h-14" />;
                  }

                  const dateStr = format(day, "yyyy-MM-dd");
                  const record = records.find((r) => r.date?.slice(0, 10) === dateStr);
                  const isCheckedIn = !!record?.checkInTime;
                  const isCheckedOut = !!record?.checkOutTime;
                  const isTodayCell = isToday(day);
                  const isFutureCell = isFuture(day);

                  let cellColorClass = "bg-muted/20 text-muted-foreground border-transparent";
                  let indicatorColor = "";
                  let statusText = "No attendance";

                  if (isCheckedIn) {
                    if (isCheckedOut) {
                      if (record?.isLate) {
                        cellColorClass = "bg-warning-soft/20 text-warning border-warning/20 hover:bg-warning-soft/30";
                        indicatorColor = "bg-warning";
                        statusText = "Late";
                      } else {
                        cellColorClass = "bg-success-soft/20 text-success border-success/20 hover:bg-success-soft/30";
                        indicatorColor = "bg-success";
                        statusText = "Present";
                      }
                    } else {
                      cellColorClass = "bg-primary-soft/20 text-primary border-primary/20 hover:bg-primary-soft/30 animate-pulse";
                      indicatorColor = "bg-primary";
                      statusText = "Checked In / Working";
                    }
                  } else if (isTodayCell) {
                    cellColorClass = "border-primary/40 bg-card text-foreground ring-1 ring-primary/20";
                  } else if (isFutureCell) {
                    cellColorClass = "bg-muted/5 text-muted-foreground/30 border-transparent cursor-default pointer-events-none";
                  }

                  return (
                    <Tooltip key={dateStr}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex flex-col justify-between p-2 rounded-lg border h-14 select-none cursor-pointer transition-all hover:scale-[1.02]",
                            cellColorClass
                          )}
                        >
                          <span className="text-xs font-semibold">{day.getDate()}</span>
                          {indicatorColor && (
                            <span className={cn("size-2 rounded-full self-end", indicatorColor)} />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs min-w-48 bg-slate-950 text-slate-200 border border-slate-800 shadow-2xl rounded-xl">
                        <p className="font-semibold text-white pb-1.5 border-b border-slate-800/80">
                          {format(day, "EEEE, MMMM d, yyyy")}
                        </p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1.5">
                          <span className="text-slate-400">Status:</span>
                          <span className="font-medium text-white">{statusText}</span>
                          <span className="text-slate-400">Check-in:</span>
                          <span className="font-medium text-white">
                            {record?.checkInTime ? formatTime(record.checkInTime) : "—"}
                          </span>
                          <span className="text-slate-400">Check-out:</span>
                          <span className="font-medium text-white">
                            {record?.checkOutTime ? formatTime(record.checkOutTime) : "—"}
                          </span>
                          {record?.checkInTime && record?.checkOutTime && (
                            <>
                              <span className="text-slate-400">Worked:</span>
                              <span className="font-medium text-white">
                                {formatDuration(record.checkInTime, record.checkOutTime)}
                              </span>
                            </>
                          )}
                        </div>
                        {record?.notes && (
                          <p className="text-[10px] text-slate-400 italic border-t border-slate-800/80 mt-2 pt-1.5 line-clamp-2 max-w-48">
                            &quot;{record.notes}&quot;
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
