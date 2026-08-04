import { apiClient, type ApiEnvelope } from "@/lib/api-client";
import type { User, Attendance, TodayStatus, EarningsBreakdown } from "@/types";

export interface UserListParams {
  search?: string;
  role?: "ADMIN" | "EMPLOYEE";
  isActive?: boolean;
  pageNo?: number;
  showPerPage?: number;
}

export interface UserListResponse {
  users: User[];
  totalData: number;
  totalPages: number;
}

export interface CreateEmployeePayload {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: "ADMIN" | "EMPLOYEE";
  profile?: {
    hourlyRate: number;
    dailyRate?: number;
    payCalculationMode?: "HOURLY" | "DAILY_PLUS_OVERTIME";
    department?: string;
  };
}

export const usersService = {
  list: async (params: UserListParams) => {
    const { data } = await apiClient.get<ApiEnvelope<UserListResponse>>("/users", { params });
    return data.data as UserListResponse;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<User>>(`/users/${id}`);
    return data.data as User;
  },

  create: async (payload: CreateEmployeePayload) => {
    const { data } = await apiClient.post<ApiEnvelope<User>>("/users", payload);
    return data.data as User;
  },

  update: async (id: string, payload: Partial<CreateEmployeePayload> & { isActive?: boolean }) => {
    const { data } = await apiClient.patch<ApiEnvelope<User>>(`/users/${id}`, payload);
    return data.data as User;
  },

  deactivate: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },

  me: async () => {
    const { data } = await apiClient.get<ApiEnvelope<User>>("/users/me");
    return data.data as User;
  },

  updateMe: async (payload: { name?: string; address?: string; phone?: string }) => {
    const { data } = await apiClient.patch<ApiEnvelope<User>>("/users/me", payload);
    return data.data as User;
  },

  myEarnings: async (params?: { from?: string; to?: string }) => {
    const { data } = await apiClient.get<ApiEnvelope<EarningsBreakdown>>("/users/me/earnings", { params });
    return data.data as EarningsBreakdown;
  },
};

export const attendanceService = {
  checkIn: async () => {
    const { data } = await apiClient.post<ApiEnvelope<Attendance>>("/attendance/check-in", {});
    return data.data as Attendance;
  },

  checkOut: async () => {
    const { data } = await apiClient.post<ApiEnvelope<Attendance>>("/attendance/check-out", {});
    return data.data as Attendance;
  },

  today: async () => {
    const { data } = await apiClient.get<ApiEnvelope<TodayStatus>>("/attendance/me/today");
    return data.data as TodayStatus;
  },

  list: async (params: { employeeId?: string; from?: string; to?: string; pageNo?: number; showPerPage?: number }) => {
    const { data } = await apiClient.get<ApiEnvelope<{ records: Attendance[]; totalData: number; totalPages: number }>>("/attendance", { params });
    return data.data as { records: Attendance[]; totalData: number; totalPages: number };
  },
};
