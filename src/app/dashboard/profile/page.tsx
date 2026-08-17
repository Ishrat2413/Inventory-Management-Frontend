"use client";

import * as React from "react";
import { toast } from "sonner";
import { Camera, LogIn, LogOut, Loader2, FileText, Upload, Trash2, ExternalLink, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

import { SectionHeader } from "@/components/shared/chart-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useUpdateMe, useTodayStatus, useCheckIn, useCheckOut, useMyEarnings } from "@/hooks/queries/use-users";
import { useMyDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/queries/use-documents";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EmployeeDocument } from "@/types/documents";

const DOC_TYPES = ["NID", "Passport", "Bank Info", "Educational Certificate", "Employment Contract", "Other"];

// ── Upload Dialog ──────────────────────────────────────────────────────────
function UploadDocumentDialog() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", documentType: "NID", expiryDate: "", notes: "" });
  const [file, setFile] = React.useState<File | null>(null);
  const upload = useUploadDocument();

  const reset = () => {
    setForm({ name: "", documentType: "NID", expiryDate: "", notes: "" });
    setFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file"); return; }
    if (!form.name) { toast.error("Document name is required"); return; }

    upload.mutate(
      { name: form.name, documentType: form.documentType, expiryDate: form.expiryDate || undefined, notes: form.notes || undefined, file },
      {
        onSuccess: () => {
          toast.success("Document uploaded successfully");
          setOpen(false);
          reset();
        },
        onError: (e) => toast.error("Upload failed", { description: getApiErrorMessage(e) }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="size-3.5 mr-1.5" /> Upload document
        </Button>
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
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          disabled={deleteDoc.isPending}
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

// ── Main Profile Page ──────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();
  const { data: today, isLoading: todayLoading } = useTodayStatus();
  const { data: earnings, isLoading: earningsLoading } = useMyEarnings();
  const { data: documents, isLoading: docsLoading } = useMyDocuments();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [form, setForm] = React.useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });

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
      <SectionHeader title="Profile" description="Manage your personal account details." />

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
                    onClick={() =>
                      checkIn.mutate(undefined, {
                        onSuccess: () => toast.success("Checked in"),
                        onError: (error) => toast.error("Check-in failed", { description: getApiErrorMessage(error) }),
                      })
                    }
                  >
                    {checkIn.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                    Check in
                  </Button>
                  <Button
                    disabled={!today?.checkedIn || !!today?.checkedOut || checkOut.isPending}
                    onClick={() =>
                      checkOut.mutate(undefined, {
                        onSuccess: () => toast.success("Checked out"),
                        onError: (error) => toast.error("Check-out failed", { description: getApiErrorMessage(error) }),
                      })
                    }
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

      {user.role === "EMPLOYEE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings &amp; Pay Summary</CardTitle>
            <CardDescription>
              Detailed breakdown of your accumulated wages for this month.
            </CardDescription>
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
                  <p className="text-xl font-bold mt-1 tabular">
                    {earnings.regularHours}h / {earnings.overtimeHours}h
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Pay (Reg / OT)</p>
                  <p className="text-xl font-bold mt-1 tabular">
                    {formatCurrency(earnings.regularPay)} / {formatCurrency(earnings.overtimePay)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-primary-soft text-primary">
                  <p className="text-xs font-semibold text-primary/85">Total Estimated Pay</p>
                  <p className="text-xl font-black mt-1 tabular">
                    {formatCurrency(earnings.totalEstimatedPay)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* ── Documents Section ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">My Documents</CardTitle>
            <CardDescription>
              Upload and manage your personal and employment-related documents.
            </CardDescription>
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
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
