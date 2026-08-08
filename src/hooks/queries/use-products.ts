"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsService, vendorsService, type ProductListParams, type ProductPayload } from "@/services/products.service";

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ["products", "low-stock"],
    queryFn: () => productsService.lowStock(),
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.getById(id as string),
    enabled: !!id,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (payload: ProductPayload) => productsService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductPayload> & { isDiscontinued?: boolean } }) =>
      productsService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: invalidate,
  });
}

export function useAssembleProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity, notes }: { productId: string; quantity: number; notes?: string }) =>
      productsService.assemble(productId, quantity, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
}

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: () => vendorsService.list({ showPerPage: 100 }),
  });
}
