"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksService, type TaskListParams, type CreateTaskPayload } from "@/services/tasks.service";

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksService.getById(id as string),
    enabled: !!id,
  });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof tasksService.update>[1] }) => tasksService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidateTasks();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.complete(id),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAssignTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof tasksService.assign>[1] }) => tasksService.assign(id, payload),
    onSuccess: invalidate,
  });
}
