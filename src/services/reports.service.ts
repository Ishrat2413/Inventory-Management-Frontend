import { apiClient, type ApiEnvelope } from "@/lib/api-client";
import type { SpendingReport, CogsReport, InventoryValueReport, Product, ProductRequest } from "@/types";

export const reportsService = {
  monthly: async (year: number, month: number) => {
    const { data } = await apiClient.get<ApiEnvelope<{ year: number; month: number; totalPurchases: number; totalCogs: number; inventoryValue: number; currency: string }>>(
      "/reports/monthly",
      { params: { year, month } },
    );
    return data.data!;
  },

  spending: async (params?: { from?: string; to?: string }) => {
    const { data } = await apiClient.get<ApiEnvelope<SpendingReport>>("/reports/spending", { params });
    return data.data as SpendingReport;
  },

  cogs: async (params?: { from?: string; to?: string }) => {
    const { data } = await apiClient.get<ApiEnvelope<CogsReport>>("/reports/cogs", { params });
    return data.data as CogsReport;
  },

  inventoryValue: async () => {
    const { data } = await apiClient.get<ApiEnvelope<InventoryValueReport>>("/reports/inventory-value");
    return data.data as InventoryValueReport;
  },

  lowStock: async () => {
    const { data } = await apiClient.get<ApiEnvelope<Product[]>>("/reports/low-stock");
    return data.data as Product[];
  },
};

export const productRequestsService = {
  list: async (params?: { status?: string; type?: string; pageNo?: number; showPerPage?: number }) => {
    const { data } = await apiClient.get<ApiEnvelope<{ requests: ProductRequest[]; totalData: number; totalPages: number }>>("/product-requests", {
      params,
    });
    return data.data as { requests: ProductRequest[]; totalData: number; totalPages: number };
  },

  create: async (payload: { productId: string; quantity: number; type: "TASK_RELATED" | "GENERAL"; taskId?: string; reason?: string }) => {
    const { data } = await apiClient.post<ApiEnvelope<ProductRequest>>("/product-requests", payload);
    return data.data as ProductRequest;
  },

  decide: async (id: string, payload: { status: "APPROVED" | "REJECTED"; rejectionReason?: string }) => {
    const { data } = await apiClient.patch<ApiEnvelope<ProductRequest>>(`/product-requests/${id}`, payload);
    return data.data as ProductRequest;
  },

  issue: async (id: string) => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/product-requests/${id}/issue`);
    return data.data;
  },
};
