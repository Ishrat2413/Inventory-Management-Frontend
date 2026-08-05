"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorsService } from "@/services/products.service";
import type { Vendor } from "@/types";

export function useVendorsList(params?: { searchKey?: string; showPerPage?: number }) {
  return useQuery({
    queryKey: ["vendors-list", params],
    queryFn: () => vendorsService.list({ ...params, showPerPage: params?.showPerPage ?? 100 }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors-list"] }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Vendor> }) =>
      vendorsService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors-list"] }),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors-list"] }),
  });
}
