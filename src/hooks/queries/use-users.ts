"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService, attendanceService, type UserListParams, type CreateEmployeePayload } from "@/services/users.service";
import { useAuthStore } from "@/store/auth-store";

export function useUsers(params: UserListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersService.list(params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => usersService.getById(id as string),
    enabled: !!id,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["users"] });
}

export function useCreateEmployee() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => usersService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateEmployeePayload> & { isActive?: boolean } }) =>
      usersService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeactivateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    onSuccess: invalidate,
  });
}

export function useUpdateMe() {
  const setUser = useAuthStore.getState().setUser;
  return useMutation({
    mutationFn: (payload: { name?: string; address?: string; phone?: string }) => usersService.updateMe(payload),
    onSuccess: (user) => setUser(user),
  });
}

export function useMyEarnings(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["me", "earnings", params],
    queryFn: () => usersService.myEarnings(params),
  });
}

export function useTodayStatus() {
  return useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.today(),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useAttendanceList(params: Parameters<typeof attendanceService.list>[0]) {
  return useQuery({
    queryKey: ["attendance", "list", params],
    queryFn: () => attendanceService.list(params),
  });
}
