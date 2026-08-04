"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productRequestsService } from "@/services/reports.service";

export function useProductRequests(params?: { status?: string; type?: string; pageNo?: number; showPerPage?: number }) {
  return useQuery({
    queryKey: ["product-requests", params],
    queryFn: () => productRequestsService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateProductRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productRequestsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-requests"] }),
  });
}

export function useDecideProductRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: "APPROVED" | "REJECTED"; rejectionReason?: string } }) =>
      productRequestsService.decide(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-requests"] }),
  });
}

export function useIssueProductRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productRequestsService.issue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
