"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Camera, LogIn, LogOut, Loader2, FileText, Upload, Trash2,
  ExternalLink, CheckCircle2, Clock, ShieldCheck, AlertTriangle,
  Save, ChevronDown, ChevronUp,
} from "lucide-react";

import { SectionHeader } from "@/components/shared/chart-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useUpdateMe, useTodayStatus, useCheckIn, useCheckOut, useMyEarnings } from "@/hooks/queries/use-users";
import { useMyDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/queries/use-documents";
import { useMyRecords, useUpsertRecord } from "@/hooks/queries/use-content-types";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EmployeeDocument } from "@/types/documents";
import type { ContentType, ContentField, EmployeeRecordGroup } from "@/services/content-types.service";

const DOC_TYPES = ["NID", "Passport", "Bank Info", "Educational Certificate", "Employment Contract", "Other"];

// ── Upload Dialog ──────────────────────────────────────────────────────────
function UploadDocumentDialog() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", documentType: "NID", expiryDate: "", notes: "" });
  const [file, setFile] = React.useState<File | null>(null);
  const upload = useUploadDocument();

  const reset = () => { setForm({ name: "", documentType: "NID", expiryDate: "", notes: "" }); setFile(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file"); return; }
    if (!form.name) { toast.error("Document name is required"); return; }
    upload.mutate(
      { name: form.name, documentType: form.documentType, expiryDate: form.expiryDate || undefined, notes: form.notes || undefined, file },
      {
        onSuccess: () => { toast.success("Document uploaded successfully"); setOpen(false); reset(); },
        onError: (e) => toast.error("Upload failed", { description: getApiErrorMessage(e) }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Upload className="size-3.5 mr-1.5" /> Upload document</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>Add a personal or employment-related document to your profile.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Document name</Label>
            <Input placeholder="e.g. National ID" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Document type</Label>
            <Select value={form.documentType} onValueChange={(v) => setForm(f => ({ ...f, documentType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Expiry date (optional)</Label>
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Upload className="size-4 mr-1.5" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Document Row ───────────────────────────────────────────────────────────
function DocumentRow({ doc }: { doc: EmployeeDocument }) {
  const deleteDoc = useDeleteDocument();
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/25 transition-colors">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.documentType}</Badge>
          {doc.isVerified && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-1.5 py-0.5 rounded-full">
              <ShieldCheck className="size-2.5" /> Verified
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1"><Clock className="size-3" /> Uploaded {formatDate(doc.uploadedAt)}</span>
          {doc.expiryDate && <span className="flex items-center gap-1"><CheckCircle2 className="size-3" /> Expires {formatDate(doc.expiryDate)}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="icon-sm" title="Open file"><ExternalLink className="size-3.5" /></Button>
        </a>
        <Button
          variant="ghost" size="icon-sm" className="text-destructive" disabled={deleteDoc.isPending}
          onClick={() => {
            if (!window.confirm(`Delete document "${doc.name}"?`)) return;
            deleteDoc.mutate(doc.id, {
              onSuccess: () => toast.success("Document deleted"),
              onError: (e) => toast.error("Failed to delete", { description: getApiErrorMessage(e) }),
            });
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Dynamic field renderer ────────────────────────────────────────────────
function DynamicFieldInput({
  field,
  value,
  onChange,
}: {
  field: ContentField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const strVal = value != null ? String(value) : "";
  const id = `dyn-field-${field.id}`;

  if (field.fieldType === "textarea") {
    return (
      <Textarea
        id={id}
        placeholder={field.placeholder ?? undefined}
        value={strVal}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if ((field.fieldType === "dropdown" || field.fieldType === "radio") && field.options?.length) {
    const opts = field.options as { label: string; value: string }[];
    return (
      <Select value={strVal} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  if (field.fieldType === "checkbox") {
    return (
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id={id}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 cursor-pointer"
        />
        <label htmlFor={id} className="text-sm cursor-pointer">{field.label}</label>
      </div>
    );
  }
  const inputType = (
    field.fieldType === "number" ? "number"
    : field.fieldType === "email" ? "email"
    : field.fieldType === "phone" ? "tel"
    : field.fieldType === "date" ? "date"
    : "text"
  );
  return (
    <Input
      id={id}
      type={inputType}
      placeholder={field.placeholder ?? undefined}
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Single dynamic content type card (editable) ───────────────────────────
function DynamicRecordCard({
  group,
  scrollRef,
}: {
  group: EmployeeRecordGroup;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { contentType, record } = group;
  const upsert = useUpsertRecord(); // no userId → own record

  // Local form state, initialised from the saved record
  const [formData, setFormData] = React.useState<Record<string, unknown>>(
    (record?.data as Record<string, unknown>) ?? {}
  );
  const [dirty, setDirty] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Re-sync when record changes from server (e.g. after invalidation)
  React.useEffect(() => {
    setFormData((record?.data as Record<string, unknown>) ?? {});
    setDirty(false);
  }, [record]);

  const handleChange = (fieldId: string, val: unknown) => {
    setFormData((d) => ({ ...d, [fieldId]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    upsert.mutate(
      { contentTypeId: contentType.id, data: formData },
      {
        onSuccess: () => {
          toast.success(`${contentType.name} saved`);
          setDirty(false);
        },
        onError: (e) => toast.error("Save failed", { description: getApiErrorMessage(e) }),
      }
    );
  };

  // Count missing required fields for badge
  const missingCount = contentType.fields.filter((f) => {
    if (!f.required) return false;
    const v = formData[f.id];
    return v == null || v === "" || v === false;
  }).length;

  return (
    <div ref={scrollRef as React.RefObject<HTMLDivElement>} className="rounded-xl border border-border overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-sm font-semibold">{contentType.name}</p>
            {contentType.description && (
              <p className="text-[11px] text-muted-foreground">{contentType.description}</p>
            )}
          </div>
          {missingCount > 0 && (
            <Badge variant="warning" className="text-[10px]">
              <AlertTriangle className="size-2.5" />
              {missingCount} required
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-[10px] text-warning font-medium">Unsaved changes</span>
          )}
          {collapsed
            ? <ChevronDown className="size-4 text-muted-foreground" />
            : <ChevronUp className="size-4 text-muted-foreground" />
          }
        </div>
      </div>

      {/* Fields */}
      {!collapsed && (
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contentType.fields.map((field) => (
              <div
                key={field.id}
                className={
                  field.fieldType === "textarea" ? "sm:col-span-2 flex flex-col gap-1.5"
                  : field.fieldType === "checkbox" ? "flex flex-col gap-1.5"
                  : "flex flex-col gap-1.5"
                }
              >
                {field.fieldType !== "checkbox" && (
                  <Label htmlFor={`dyn-field-${field.id}`} className="text-sm flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive text-xs">*</span>}
                  </Label>
                )}
                <DynamicFieldInput
                  field={field}
                  value={formData[field.id]}
                  onChange={(v) => handleChange(field.id, v)}
                />
                {field.helpText && (
                  <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <Button onClick={handleSave} disabled={upsert.isPending || !dirty} size="sm">
              {upsert.isPending
                ? <Loader2 className="size-3.5 animate-spin mr-1.5" />
                : <Save className="size-3.5 mr-1.5" />}
              Save {contentType.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Incomplete required fields alert banner ───────────────────────────────
function IncompleteFieldsAlert({
  groups,
  onScrollTo,
}: {
  groups: EmployeeRecordGroup[];
  onScrollTo: (contentTypeId: string) => void;
}) {
  // Compute which groups have unfilled required fields
  const incomplete = groups.filter(({ contentType, record }) =>
    contentType.fields.some((f) => {
      if (!f.required) return false;
      const data = (record?.data as Record<string, unknown>) ?? {};
      const v = data[f.id];
      return v == null || v === "" || v === false;
    })
  );

  if (incomplete.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4">
      <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warning">Some profile fields need to be filled</p>
        <p className="text-xs text-muted-foreground mt-0.5 mb-2">
          The following sections have required fields that are empty:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {incomplete.map(({ contentType }) => (
            <button
              key={contentType.id}
              onClick={() => onScrollTo(contentType.id)}
              className="text-[11px] font-medium text-warning underline underline-offset-2 decoration-warning/50 hover:decoration-warning transition-colors"
            >
              {contentType.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();
  const { data: today, isLoading: todayLoading } = useTodayStatus();
  const { data: earnings, isLoading: earningsLoading } = useMyEarnings();
  const { data: documents, isLoading: docsLoading } = useMyDocuments();
  const { data: records, isLoading: recordsLoading } = useMyRecords();
  const checkIn  = useCheckIn();
  const checkOut = useCheckOut();

  const [form, setForm] = React.useState({
    name:    user?.name    ?? "",
    phone:   user?.phone   ?? "",
    address: user?.address ?? "",
  });

  // Refs for scroll-to navigation from the alert banner
  const sectionRefs = React.useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});
  const getSectionRef = (contentTypeId: string) => {
    if (!sectionRefs.current[contentTypeId]) {
      sectionRefs.current[contentTypeId] = React.createRef<HTMLDivElement>();
    }
    return sectionRefs.current[contentTypeId];
  };

  const scrollToSection = (contentTypeId: string) => {
    sectionRefs.current[contentTypeId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!user) return null;
  const displayName = user.name ?? user.email;

  const handleSave = () => {
    updateMe.mutate(
      { name: form.name, phone: form.phone, address: form.address },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (error) => toast.error("Couldn't update profile", { description: getApiErrorMessage(error) }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Profile" description="Manage your personal account details and additional information." />

      {/* ── Incomplete fields alert (dynamic, real-time via React Query) ── */}
      {user.role === "EMPLOYEE" && records && records.length > 0 && (
        <IncompleteFieldsAlert groups={records} onScrollTo={scrollToSection} />
      )}

      {/* ── Today's Attendance ── */}
      {user.role === "EMPLOYEE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s attendance</CardTitle>
            <CardDescription>Clock in and out — your earnings update in real time.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            {todayLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <>
                <Badge variant={today?.checkedIn ? (today?.checkedOut ? "muted" : "success") : "warning"}>
                  {today?.checkedOut ? "Checked out" : today?.checkedIn ? "Checked in" : "Not checked in"}
                </Badge>
                <div className="text-sm">
                  <span className="text-muted-foreground">Hours so far: </span>
                  <span className="tabular font-medium">{today?.hoursSoFar ?? 0}h</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Estimated pay: </span>
                  <span className="tabular font-medium">{formatCurrency(today?.estimatedPaySoFar ?? 0)}</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!!today?.checkedIn || checkIn.isPending}
                    onClick={() => checkIn.mutate(undefined, {
                      onSuccess: () => toast.success("Checked in"),
                      onError: (error) => toast.error("Check-in failed", { description: getApiErrorMessage(error) }),
                    })}
                  >
                    {checkIn.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                    Check in
                  </Button>
                  <Button
                    disabled={!today?.checkedIn || !!today?.checkedOut || checkOut.isPending}
                    onClick={() => checkOut.mutate(undefined, {
                      onSuccess: () => toast.success("Checked out"),
                      onError: (error) => toast.error("Check-out failed", { description: getApiErrorMessage(error) }),
                    })}
                  >
                    {checkOut.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    Check out
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Earnings ── */}
      {user.role === "EMPLOYEE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings &amp; Pay Summary</CardTitle>
            <CardDescription>Detailed breakdown of your accumulated wages for this month.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {earningsLoading ? (
              <p className="text-muted-foreground text-sm">Loading earnings…</p>
            ) : !earnings ? (
              <p className="text-muted-foreground text-sm">No earnings records found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Days Worked</p>
                  <p className="text-xl font-bold mt-1 tabular">{earnings.daysWorked}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Hours (Reg / OT)</p>
                  <p className="text-xl font-bold mt-1 tabular">{earnings.regularHours}h / {earnings.overtimeHours}h</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Pay (Reg / OT)</p>
                  <p className="text-xl font-bold mt-1 tabular">{formatCurrency(earnings.regularPay)} / {formatCurrency(earnings.overtimePay)}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-primary-soft text-primary">
                  <p className="text-xs font-semibold text-primary/85">Total Estimated Pay</p>
                  <p className="text-xl font-black mt-1 tabular">{formatCurrency(earnings.totalEstimatedPay)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Personal Information ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
          <CardDescription>This information appears across the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <InitialsAvatar name={displayName} size="size-16" className="text-base" />
              <button className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full ring-2 ring-card cursor-pointer">
                <Camera className="size-3" />
              </button>
            </div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-muted-foreground text-sm">{user.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email address</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Input value={user.role} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone number</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input
                placeholder="Your home or mailing address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Button onClick={handleSave} disabled={updateMe.isPending}>
              {updateMe.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Additional Information (Dynamic Content Types) ── */}
      {user.role === "EMPLOYEE" && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Additional Information</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fill in the fields below as required by your organisation.
            </p>
          </div>

          {recordsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : !records || records.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-10">
              <p className="text-sm text-muted-foreground">
                No additional fields configured yet. An admin will set these up.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map((group) => (
                <DynamicRecordCard
                  key={group.contentType.id}
                  group={group}
                  scrollRef={getSectionRef(group.contentType.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Documents ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">My Documents</CardTitle>
            <CardDescription>Upload and manage your personal and employment-related documents.</CardDescription>
          </div>
          <UploadDocumentDialog />
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : !documents?.length ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs text-muted-foreground">Upload your NID, passport, certificates, or other documents.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
