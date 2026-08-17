"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  User, Mail, Phone, MapPin, Building2, Calendar, CreditCard,
  Pencil, X, Save, Loader2, ShieldCheck, ShieldOff, FileText,
  Upload, Trash2, ExternalLink, CheckCircle2, Clock
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { EmployeeActiveBadge } from "@/components/shared/status-badges";
import { useUser, useUpdateUser } from "@/hooks/queries/use-users";
import { useUserDocuments, useUploadDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/queries/use-documents";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { User as UserType } from "@/types";
import type { EmployeeDocument } from "@/types/documents";

// ── Document type options ──────────────────────────────────────────────────
const DOC_TYPES = ["NID", "Passport", "Bank Info", "Educational Certificate", "Employment Contract", "Other"];

// ── Upload Dialog ──────────────────────────────────────────────────────────
function UploadDocumentForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = React.useState({ name: "", documentType: "NID", expiryDate: "", notes: "" });
  const [file, setFile] = React.useState<File | null>(null);
  const upload = useUploadDocument();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file"); return; }
    if (!form.name) { toast.error("Document name is required"); return; }

    upload.mutate(
      { name: form.name, documentType: form.documentType, expiryDate: form.expiryDate || undefined, notes: form.notes || undefined, file },
      {
        onSuccess: () => { toast.success("Document uploaded"); onDone(); },
        onError: (e) => toast.error("Upload failed", { description: getApiErrorMessage(e) }),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-muted/20">
      <p className="text-sm font-semibold">Upload new document</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Document name</Label>
          <Input placeholder="e.g. National ID" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={form.documentType} onValueChange={(v) => setForm(f => ({ ...f, documentType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Expiry date (optional)</Label>
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">File</Label>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Notes (optional)</Label>
        <Input placeholder="Any notes about this document..." value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex gap-2 mt-1">
        <Button type="submit" size="sm" disabled={upload.isPending}>
          {upload.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Upload className="size-3.5 mr-1.5" />}
          Upload
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Document Card ──────────────────────────────────────────────────────────
function DocumentCard({ doc, userId }: { doc: EmployeeDocument; userId: string }) {
  const updateDoc = useUpdateDocument(userId);
  const deleteDoc = useDeleteDocument(userId);

  const handleVerify = () => {
    updateDoc.mutate(
      { id: doc.id, payload: { isVerified: !doc.isVerified } },
      {
        onSuccess: () => toast.success(doc.isVerified ? "Document unverified" : "Document verified"),
        onError: (e) => toast.error("Failed", { description: getApiErrorMessage(e) }),
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete document "${doc.name}"?`)) return;
    deleteDoc.mutate(doc.id, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (e) => toast.error("Failed", { description: getApiErrorMessage(e) }),
    });
  };

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/25 transition-colors">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          {doc.isVerified && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="size-2.5" /> Verified
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{doc.documentType} · Uploaded {formatDate(doc.uploadedAt)}</p>
        {doc.expiryDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="size-3" /> Expires {formatDate(doc.expiryDate)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="icon-sm" title="Open file"><ExternalLink className="size-3.5" /></Button>
        </a>
        <Button
          variant="ghost" size="icon-sm"
          title={doc.isVerified ? "Unverify" : "Verify"}
          onClick={handleVerify}
          disabled={updateDoc.isPending}
          className={doc.isVerified ? "text-success" : "text-muted-foreground"}
        >
          {doc.isVerified ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={handleDelete} disabled={deleteDoc.isPending}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Employee Detail Drawer ────────────────────────────────────────────
export function EmployeeDetailDrawer({
  employee,
  open,
  onOpenChange,
}: {
  employee: UserType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showUploadForm, setShowUploadForm] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: "", phone: "", address: "", department: "",
    hourlyRate: "", dailyRate: "", payCalculationMode: "HOURLY" as "HOURLY" | "DAILY_PLUS_OVERTIME",
  });

  const { data: fullUser, isLoading } = useUser(open && employee ? employee.id : null);
  const { data: documents, isLoading: docsLoading } = useUserDocuments(open && employee ? employee.id : null);
  const updateUser = useUpdateUser();

  // Initialize the edit form values from fullUser when user clicks "Edit"
  const getFormValues = () => ({
    name: fullUser?.name ?? employee?.name ?? "",
    phone: fullUser?.phone ?? employee?.phone ?? "",
    address: fullUser?.address ?? employee?.address ?? "",
    department: fullUser?.employeeProfile?.department ?? "",
    hourlyRate: fullUser?.employeeProfile?.hourlyRate ? String(Number(fullUser.employeeProfile.hourlyRate)) : "",
    dailyRate: fullUser?.employeeProfile?.dailyRate ? String(Number(fullUser.employeeProfile.dailyRate)) : "",
    payCalculationMode: (fullUser?.employeeProfile?.payCalculationMode as "HOURLY" | "DAILY_PLUS_OVERTIME") ?? "HOURLY",
  });

  const handleSave = () => {
    if (!employee) return;
    updateUser.mutate(
      {
        id: employee.id,
        payload: {
          name: editForm.name || undefined,
          phone: editForm.phone || undefined,
          address: editForm.address || undefined,
          profile: employee.role === "EMPLOYEE" ? {
            hourlyRate: editForm.hourlyRate ? Number(editForm.hourlyRate) : 0,
            dailyRate: editForm.dailyRate ? Number(editForm.dailyRate) : undefined,
            payCalculationMode: editForm.payCalculationMode,
            department: editForm.department || undefined,
          } : undefined,
        },
      },
      {
        onSuccess: () => { toast.success("Employee updated"); setIsEditing(false); },
        onError: (e) => toast.error("Update failed", { description: getApiErrorMessage(e) }),
      }
    );
  };

  const user = fullUser ?? employee;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <Skeleton className="size-12 rounded-full" />
              ) : (
                <InitialsAvatar name={user?.name ?? user?.email ?? "?"} size="size-12" className="text-base" />
              )}
              <div>
                <SheetTitle className="text-base">{user?.name ?? user?.email}</SheetTitle>
                <SheetDescription className="text-xs">{user?.email}</SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <EmployeeActiveBadge isActive={user?.isActive ?? true} />
              <Badge variant={user?.role === "ADMIN" ? "default" : "outline"} className="capitalize">
                {user?.role?.toLowerCase()}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 w-auto self-start">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents {documents?.length ? `(${documents.length})` : ""}</TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile" className="flex-1 px-6 pb-6 mt-4 flex flex-col gap-5">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : !isEditing ? (
              <>
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: User, label: "Full name", value: user?.name ?? "—" },
                    { icon: Mail, label: "Email", value: user?.email ?? "—" },
                    { icon: Phone, label: "Phone", value: user?.phone ?? "—" },
                    { icon: MapPin, label: "Address", value: user?.address ?? "—" },
                    { icon: Building2, label: "Department", value: user?.employeeProfile?.department ?? "—" },
                    { icon: Calendar, label: "Join date", value: user?.employeeProfile?.joinDate ? formatDate(user.employeeProfile.joinDate) : formatDate(user?.createdAt ?? "") },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border">
                      <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-medium truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pay info (employees only) */}
                {user?.role === "EMPLOYEE" && user.employeeProfile && (
                  <div className="rounded-xl border border-border bg-primary/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80 mb-3 flex items-center gap-1.5">
                      <CreditCard className="size-3.5" /> Pay Information
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Hourly rate</p>
                        <p className="font-semibold">{formatCurrency(Number(user.employeeProfile.hourlyRate))}/hr</p>
                      </div>
                      {user.employeeProfile.dailyRate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Daily rate</p>
                          <p className="font-semibold">{formatCurrency(Number(user.employeeProfile.dailyRate))}/day</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Pay mode</p>
                        <p className="font-semibold capitalize">{user.employeeProfile.payCalculationMode.replace("_", " ").toLowerCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">OT multiplier</p>
                        <p className="font-semibold">{user.employeeProfile.overtimeMultiplier}×</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button variant="outline" size="sm" className="self-start" onClick={() => { setEditForm(getFormValues()); setIsEditing(true); }}>
                  <Pencil className="size-3.5 mr-1.5" /> Edit employee
                </Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Full name</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label className="text-xs">Address</Label>
                    <Input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} />
                  </div>

                  {employee?.role === "EMPLOYEE" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Department</Label>
                        <Input value={editForm.department} onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Hourly rate</Label>
                        <Input type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm(f => ({ ...f, hourlyRate: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Daily rate (optional)</Label>
                        <Input type="number" value={editForm.dailyRate} onChange={(e) => setEditForm(f => ({ ...f, dailyRate: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Pay mode</Label>
                        <Select value={editForm.payCalculationMode} onValueChange={(v) => setEditForm(f => ({ ...f, payCalculationMode: v as typeof f.payCalculationMode }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="DAILY_PLUS_OVERTIME">Daily + Overtime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={updateUser.isPending}>
                    {updateUser.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
                    Save changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="size-3.5 mr-1.5" /> Cancel
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Documents Tab ── */}
          <TabsContent value="documents" className="px-6 pb-6 mt-4 flex flex-col gap-4">
            {showUploadForm ? (
              <UploadDocumentForm onDone={() => setShowUploadForm(false)} />
            ) : (
              <Button size="sm" variant="outline" className="self-start" onClick={() => setShowUploadForm(true)}>
                <Upload className="size-3.5 mr-1.5" /> Upload document
              </Button>
            )}

            {docsLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : !documents?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No documents yet</p>
                <p className="text-xs text-muted-foreground">No documents have been uploaded for this employee.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} userId={employee?.id ?? ""} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
