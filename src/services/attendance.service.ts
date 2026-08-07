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
  notes?: string | null;
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
    // Map userId to employeeId for the backend query parameter
    const apiParams = params ? {
      ...params,
      employeeId: params.userId,
      userId: undefined,
    } : undefined;

    const { data } = await apiClient.get<ApiEnvelope<{ records: any[]; totalData: number; totalPages: number }>>(
      "/attendance",
      { params: apiParams }
    );
    const res = data.data;
    if (res && res.records) {
      res.records = res.records.map((r) => ({
        ...r,
        userId: r.employeeId,
        checkInTime: r.checkIn ?? r.checkInTime ?? null,
        checkOutTime: r.checkOut ?? r.checkOutTime ?? null,
      }));
    }
    return res as { records: AttendanceRecord[]; totalData: number; totalPages: number };
  },

  myToday: async () => {
    const { data } = await apiClient.get<ApiEnvelope<any>>("/attendance/me/today");
    const r = data.data;
    if (r) {
      return {
        ...r,
        userId: r.employeeId,
        checkInTime: r.checkIn ?? r.checkInTime ?? null,
        checkOutTime: r.checkOut ?? r.checkOutTime ?? null,
      } as AttendanceRecord;
    }
    return null;
  },

  checkIn: async () => {
    const { data } = await apiClient.post<ApiEnvelope<any>>("/attendance/check-in", {});
    const r = data.data;
    return {
      ...r,
      userId: r.employeeId,
      checkInTime: r.checkIn ?? r.checkInTime ?? null,
      checkOutTime: r.checkOut ?? r.checkOutTime ?? null,
    } as AttendanceRecord;
  },

  checkOut: async () => {
    const { data } = await apiClient.post<ApiEnvelope<any>>("/attendance/check-out", {});
    const r = data.data;
    return {
      ...r,
      userId: r.employeeId,
      checkInTime: r.checkIn ?? r.checkInTime ?? null,
      checkOutTime: r.checkOut ?? r.checkOutTime ?? null,
    } as AttendanceRecord;
  },

  override: async (payload: {
    userId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }) => {
    // Map frontend keys to backend validation keys
    const backendPayload = {
      employeeId: payload.userId,
      date: payload.date,
      checkIn: payload.checkInTime || undefined,
      checkOut: payload.checkOutTime || undefined,
      notes: payload.notes,
    };
    const { data } = await apiClient.post<ApiEnvelope<any>>("/attendance/override", backendPayload);
    const r = data.data;
    return {
      ...r,
      userId: r.employeeId,
      checkInTime: r.checkIn ?? r.checkInTime ?? null,
      checkOutTime: r.checkOut ?? r.checkOutTime ?? null,
    } as AttendanceRecord;
  },
};
