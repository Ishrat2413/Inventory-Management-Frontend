import { apiClient, type ApiEnvelope } from "@/lib/api-client";

export interface AttendanceRecord {
  id: string;
  userId: string;
  user?: { id: string; name?: string | null; email: string };
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  source: "FINGERPRINT" | "MANUAL";
  isLate: boolean;
  overtimeMinutes: number;
  hoursWorked?: number | null;
  overriddenById?: string | null;
  overriddenBy?: { id: string; name?: string | null } | null;
  createdAt: string;
}

export interface AttendanceListParams {
  userId?: string;
  from?: string;
  to?: string;
  pageNo?: number;
  showPerPage?: number;
}

export const attendanceService = {
  list: async (params?: AttendanceListParams) => {
    const { data } = await apiClient.get<ApiEnvelope<{ records: AttendanceRecord[]; totalData: number; totalPages: number }>>(
      "/attendance",
      { params }
    );
    return data.data as { records: AttendanceRecord[]; totalData: number; totalPages: number };
  },

  myToday: async () => {
    const { data } = await apiClient.get<ApiEnvelope<AttendanceRecord>>("/attendance/me/today");
    return data.data as AttendanceRecord | null;
  },

  override: async (payload: {
    userId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post<ApiEnvelope<AttendanceRecord>>("/attendance/override", payload);
    return data.data as AttendanceRecord;
  },
};
