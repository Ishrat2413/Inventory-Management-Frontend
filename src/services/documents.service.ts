import { apiClient, type ApiEnvelope } from "@/lib/api-client";
import type { EmployeeDocument } from "@/types/documents";

export interface UploadDocumentPayload {
  name: string;
  documentType: string;
  expiryDate?: string;
  notes?: string;
  file: File;
}

export const documentsService = {
  /** GET /documents — own documents */
  listMine: async (): Promise<EmployeeDocument[]> => {
    const { data } = await apiClient.get<ApiEnvelope<EmployeeDocument[]>>("/documents");
    return data.data as EmployeeDocument[];
  },

  /** GET /documents/user/:userId — admin: another user's documents */
  listForUser: async (userId: string): Promise<EmployeeDocument[]> => {
    const { data } = await apiClient.get<ApiEnvelope<EmployeeDocument[]>>(`/documents/user/${userId}`);
    return data.data as EmployeeDocument[];
  },

  /** POST /documents — upload a new document (multipart) */
  upload: async (payload: UploadDocumentPayload): Promise<EmployeeDocument> => {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("documentType", payload.documentType);
    if (payload.expiryDate) form.append("expiryDate", payload.expiryDate);
    if (payload.notes) form.append("notes", payload.notes);
    form.append("file", payload.file);

    const { data } = await apiClient.post<ApiEnvelope<EmployeeDocument>>("/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as EmployeeDocument;
  },

  /** PATCH /documents/:id — update metadata */
  update: async (
    id: string,
    payload: { name?: string; documentType?: string; expiryDate?: string | null; notes?: string; isVerified?: boolean }
  ): Promise<EmployeeDocument> => {
    const { data } = await apiClient.patch<ApiEnvelope<EmployeeDocument>>(`/documents/${id}`, payload);
    return data.data as EmployeeDocument;
  },

  /** DELETE /documents/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
