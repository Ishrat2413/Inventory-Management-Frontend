import { apiClient, type ApiEnvelope } from "@/lib/api-client";
import type { Task, TaskStatus } from "@/types";

export interface TaskListParams {
  status?: TaskStatus;
  assigneeId?: string;
  pageNo?: number;
  showPerPage?: number;
}

export interface TaskListResponse {
  tasks: Task[];
  totalData: number;
  totalPages: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedEmployeeIds?: string[];
  requiredProducts?: { productId: string; quantity: number }[];
}

export const tasksService = {
  list: async (params: TaskListParams) => {
    const { data } = await apiClient.get<ApiEnvelope<TaskListResponse>>("/tasks", { params });
    return data.data as TaskListResponse;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<Task>>(`/tasks/${id}`);
    return data.data as Task;
  },

  create: async (payload: CreateTaskPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<Task>>("/tasks", payload);
    return data.data as Task;
  },

  update: async (id: string, payload: { title?: string; description?: string; status?: "PENDING" | "IN_PROGRESS" | "CANCELLED" }) => {
    const { data } = await apiClient.patch<ApiEnvelope<Task>>(`/tasks/${id}`, payload);
    return data.data as Task;
  },

  complete: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<Task>>(`/tasks/${id}/complete`);
    return data.data as Task;
  },

  assign: async (id: string, payload: { addEmployeeIds?: string[]; removeEmployeeIds?: string[] }) => {
    const { data } = await apiClient.post<ApiEnvelope<Task>>(`/tasks/${id}/assign`, payload);
    return data.data as Task;
  },
};
