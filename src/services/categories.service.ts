import { apiClient, type ApiEnvelope } from "@/lib/api-client";

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  _count?: { products: number };
}

export const categoriesService = {
  list: async (search?: string) => {
    const { data } = await apiClient.get<ApiEnvelope<{ categories: Category[]; totalData: number }>>(
      "/categories",
      { params: search ? { search } : undefined }
    );
    return data.data as { categories: Category[]; totalData: number };
  },

  create: async (payload: { name: string; description?: string }) => {
    const { data } = await apiClient.post<ApiEnvelope<Category>>("/categories", payload);
    return data.data as Category;
  },

  update: async (id: string, payload: { name?: string; description?: string }) => {
    const { data } = await apiClient.patch<ApiEnvelope<Category>>(`/categories/${id}`, payload);
    return data.data as Category;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/categories/${id}`);
  },
};
