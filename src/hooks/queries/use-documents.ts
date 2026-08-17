"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsService, type UploadDocumentPayload } from "@/services/documents.service";

function useInvalidateDocs(userId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["documents", "mine"] });
    if (userId) queryClient.invalidateQueries({ queryKey: ["documents", "user", userId] });
  };
}

/** Employee: list own documents */
export function useMyDocuments() {
  return useQuery({
    queryKey: ["documents", "mine"],
    queryFn: () => documentsService.listMine(),
  });
}

/** Admin: list documents for a specific user */
export function useUserDocuments(userId: string | null) {
  return useQuery({
    queryKey: ["documents", "user", userId],
    queryFn: () => documentsService.listForUser(userId as string),
    enabled: !!userId,
  });
}

/** Upload a new document */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadDocumentPayload) => documentsService.upload(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

/** Update document metadata */
export function useUpdateDocument(userId?: string) {
  const invalidate = useInvalidateDocs(userId);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof documentsService.update>[1] }) =>
      documentsService.update(id, payload),
    onSuccess: invalidate,
  });
}

/** Delete a document */
export function useDeleteDocument(userId?: string) {
  const invalidate = useInvalidateDocs(userId);
  return useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: invalidate,
  });
}
