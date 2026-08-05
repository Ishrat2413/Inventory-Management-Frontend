import { apiClient, type ApiEnvelope } from "@/lib/api-client";
import type { Product, Vendor, BOMTreeNode } from "@/types";

export interface ProductListParams {
  search?: string;
  lowStock?: boolean;
  isDiscontinued?: boolean;
  isComposite?: boolean;
  category?: string;
  pageNo?: number;
  showPerPage?: number;
}

export interface ProductListResponse {
  products: Product[];
  totalData: number;
  totalPages: number;
}

export interface ProductPayload {
  name: string;
  sku?: string;
  description?: string;
  unitPrice: number;
  currentStock?: number;
  lowStockThreshold?: number;
  vendorId?: string;
  isComposite?: boolean;
  customFields?: Record<string, unknown>;
}

export const productsService = {
  list: async (params: ProductListParams) => {
    const { data } = await apiClient.get<ApiEnvelope<ProductListResponse>>("/products", { params });
    return data.data as ProductListResponse;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<Product & { bomSummary: unknown[] }>>(`/products/${id}`);
    return data.data as Product;
  },

  lowStock: async () => {
    const { data } = await apiClient.get<ApiEnvelope<Product[]>>("/products/low-stock");
    return data.data as Product[];
  },

  create: async (payload: ProductPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<Product>>("/products", payload);
    return data.data as Product;
  },

  update: async (id: string, payload: Partial<ProductPayload> & { isDiscontinued?: boolean }) => {
    const { data } = await apiClient.patch<ApiEnvelope<Product>>(`/products/${id}`, payload);
    return data.data as Product;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/products/${id}`);
  },

  getBOM: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<BOMTreeNode>>(`/products/${id}/bom`);
    return data.data as BOMTreeNode;
  },

  replaceBOM: async (id: string, items: { childProductId: string; quantityRequired: number }[]) => {
    const { data } = await apiClient.put<ApiEnvelope<BOMTreeNode>>(`/products/${id}/bom`, { items });
    return data.data as BOMTreeNode;
  },
};

export const vendorsService = {
  list: async (params?: { searchKey?: string; pageNo?: number; showPerPage?: number }) => {
    const { data } = await apiClient.get<ApiEnvelope<{ vendors: Vendor[]; totalData: number; totalPages: number }>>("/vendors", { params });
    return data.data as { vendors: Vendor[]; totalData: number; totalPages: number };
  },

  create: async (payload: { name: string; contact?: string | null; phone?: string | null; email?: string | null; address?: string | null; notes?: string | null }) => {
    const { data } = await apiClient.post<ApiEnvelope<Vendor>>("/vendors", payload);
    return data.data as Vendor;
  },

  update: async (id: string, payload: { name?: string; contact?: string | null; phone?: string | null; email?: string | null; address?: string | null; notes?: string | null }) => {
    const { data } = await apiClient.patch<ApiEnvelope<Vendor>>(`/vendors/${id}`, payload);
    return data.data as Vendor;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/vendors/${id}`);
  },
};

