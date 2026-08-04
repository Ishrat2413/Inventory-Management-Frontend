import { apiClient, type ApiEnvelope } from "@/lib/api-client";
import type { User } from "@/types";

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
    return data.data as LoginResponse;
  },

  logout: async () => {
    await apiClient.post("/auth/logout");
  },

  me: async () => {
    const { data } = await apiClient.get<ApiEnvelope<User>>("/auth/me");
    return data.data as User;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    await apiClient.post("/auth/change-password", payload);
  },
};
