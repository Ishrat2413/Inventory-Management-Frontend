import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { AttendanceView } from "@/features/attendance/attendance-view";

export const metadata: Metadata = { title: "Attendance — Dabang" };

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-success-soft text-success">
          <CalendarCheck className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Track employee check-ins and attendance records</p>
        </div>
      </div>
      <AttendanceView />
    </div>
  );
}
