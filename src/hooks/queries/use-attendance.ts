"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService, type AttendanceListParams } from "@/services/attendance.service";

export function useAttendance(params?: AttendanceListParams) {
  return useQuery({
    queryKey: ["attendance", params],
    queryFn: () => attendanceService.list(params),
    staleTime: 60 * 1000,
  });
}

export function useMyTodayAttendance() {
  return useQuery({
    queryKey: ["attendance", "me", "today"],
    queryFn: attendanceService.myToday,
    staleTime: 60 * 1000,
  });
}

export function useOverrideAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceService.override,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceService.checkIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
