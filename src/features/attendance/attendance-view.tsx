"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarCheck, Clock, Users, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendance, useOverrideAttendance } from "@/hooks/queries/use-attendance";
import { useUsers } from "@/hooks/queries/use-users";
import { getApiErrorMessage } from "@/lib/api-client";
import type { AttendanceRecord } from "@/services/attendance.service";
import { cn } from "@/lib/utils";

function formatTime(dt?: string | null) {
  if (!dt) return "—";
  try { return format(parseISO(dt), "hh:mm a"); } catch { return "—"; }
}

function formatDuration(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return "—";
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  } catch { return "—"; }
}

function StatusBadge({ record }: { record: AttendanceRecord }) {
  if (!record.checkInTime) return <span className="badge-destructive">Absent</span>;
  if (record.isLate) return <span className="badge-warning">Late</span>;
  return <span className="badge-success">Present</span>;
}

function OverrideDialog({
  open,
  onOpenChange,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: AttendanceRecord;
}) {
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const override = useOverrideAttendance();

  React.useEffect(() => {
    if (open && record) {
      setCheckIn(record.checkInTime ? format(parseISO(record.checkInTime), "HH:mm") : "");
      setCheckOut(record.checkOutTime ? format(parseISO(record.checkOutTime), "HH:mm") : "");
      setNotes("");
    }
  }, [open, record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    const date = record.date.split("T")[0];
    const toISO = (time: string) => time ? `${date}T${time}:00.000Z` : undefined;

    override.mutate(
      { userId: record.userId, date, checkInTime: toISO(checkIn), checkOutTime: toISO(checkOut), notes: notes || undefined },
      {
        onSuccess: () => { toast.success("Attendance record updated"); onOpenChange(false); },
        onError: (error) => toast.error("Error", { description: getApiErrorMessage(error) }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Override attendance</DialogTitle>
          <DialogDescription>Manually update check-in/out times for this employee.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={override.isPending}>
              {override.isPending && <Loader2 className="size-4 animate-spin" />}
              Save override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AttendanceView() {
  const [selectedDate, setSelectedDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [overrideRecord, setOverrideRecord] = React.useState<AttendanceRecord | undefined>();
  const [overrideOpen, setOverrideOpen] = React.useState(false);

  const { data: attendanceData, isLoading } = useAttendance({
    from: selectedDate,
    to: selectedDate,
    showPerPage: 100,
  });
  const { data: usersData } = useUsers({ role: "EMPLOYEE", showPerPage: 100 });

  const records = attendanceData?.records ?? [];
  const employees = usersData?.users ?? [];

  const presentCount = records.filter((r) => r.checkInTime).length;
  const lateCount = records.filter((r) => r.isLate).length;
  const absentCount = Math.max(0, employees.length - presentCount);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-center gap-4 stat-card">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Present</p>
            <p className="text-2xl font-bold tabular">{isLoading ? "—" : presentCount}</p>
          </div>
        </div>
        <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-center gap-4 stat-card">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Late</p>
            <p className="text-2xl font-bold tabular">{isLoading ? "—" : lateCount}</p>
          </div>
        </div>
        <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-center gap-4 stat-card">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold tabular">{isLoading ? "—" : absentCount}</p>
          </div>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => changeDate(-1)}><ChevronLeft className="size-4" /></Button>
          <Input type="date" className="w-auto" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <Button size="icon" variant="outline" onClick={() => changeDate(1)} disabled={selectedDate >= format(new Date(), "yyyy-MM-dd")}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Attendance Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <OverrideDialog open={overrideOpen} onOpenChange={setOverrideOpen} record={overrideRecord} />
        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <CalendarCheck className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No attendance records</p>
            <p className="text-xs text-muted-foreground">No attendance found for this date.</p>
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
              {records.map((record) => (
                <tr key={record.id} className={cn("hover:bg-muted/30 transition-colors", !record.checkInTime && "opacity-60")}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{record.user?.name || record.user?.email || "Unknown"}</p>
                    {record.overriddenById && (
                      <p className="text-[10px] text-muted-foreground">Override by admin</p>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge record={record} /></td>
                  <td className="px-4 py-3 tabular text-muted-foreground">{formatTime(record.checkInTime)}</td>
                  <td className="px-4 py-3 tabular text-muted-foreground">{formatTime(record.checkOutTime)}</td>
                  <td className="px-4 py-3 tabular text-muted-foreground">{formatDuration(record.checkInTime, record.checkOutTime)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => { setOverrideRecord(record); setOverrideOpen(true); }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
