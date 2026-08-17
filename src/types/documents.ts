// ---------- Employee Documents ----------
export interface EmployeeDocument {
  id: string;
  userId: string;
  name: string;
  documentType: string;
  fileUrl: string;
  fileStorageId: string;
  expiryDate: string | null;
  isVerified: boolean;
  notes: string | null;
  uploadedAt: string;
  updatedAt: string;
}
