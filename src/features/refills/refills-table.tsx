"use client";

import * as React from "react";
import { toast } from "sonner";
import { ClipboardList, Check, X, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RequestStatusBadge } from "@/components/shared/status-badges";
import { EmptyState } from "@/components/shared/states";
import { useDecideProductRequest } from "@/hooks/queries/use-product-requests";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ProductRequest } from "@/types";

export function RefillsTable({ requests }: { requests: ProductRequest[] }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const decideMutation = useDecideProductRequest();

  // Rejection state
  const [rejectingRequest, setRejectingRequest] = React.useState<ProductRequest | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");

  const handleApprove = (req: ProductRequest) => {
    decideMutation.mutate(
      { id: req.id, payload: { status: "APPROVED" } },
      {
        onSuccess: () => toast.success("Refill request approved"),
        onError: (err) => toast.error("Action failed", { description: getApiErrorMessage(err) }),
      }
    );
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    decideMutation.mutate(
      {
        id: rejectingRequest.id,
        payload: { status: "REJECTED", rejectionReason: rejectionReason || undefined },
      },
      {
        onSuccess: () => {
          toast.success("Refill request rejected");
          setRejectingRequest(null);
          setRejectionReason("");
        },
        onError: (err) => toast.error("Action failed", { description: getApiErrorMessage(err) }),
      }
    );
  };

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No refill requests"
        description="Any submitted product refill requests will appear here."
      />
    );
  }

  const isMutating = (id: string) =>
    decideMutation.isPending && (decideMutation.variables as { id: string }).id === id;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectingRequest} onOpenChange={(open) => { if (!open) setRejectingRequest(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject refill request</DialogTitle>
            <DialogDescription>
              Specify a reason for rejecting this refill request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rejection-reason">Reason</Label>
              <Input
                id="rejection-reason"
                placeholder="e.g. Current stock is sufficient / Vendor delayed"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectingRequest(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={decideMutation.isPending}>
                {decideMutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Qty Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Date</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell>
                <p className="font-semibold">{req.product?.name}</p>
                <p className="text-xs text-muted-foreground tabular">SKU: {req.product?.sku || "—"}</p>
              </TableCell>
              <TableCell className="font-semibold tabular text-foreground">
                {Number(req.quantity)}
              </TableCell>
              <TableCell>
                <RequestStatusBadge status={req.status} />
                {req.rejectionReason && (
                  <p className="text-[10px] text-destructive mt-1 max-w-50 leading-tight">
                    Reason: {req.rejectionReason}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {req.requestedBy?.name || "System"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs max-w-50 truncate" title={req.reason || ""}>
                {req.reason || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs tabular">
                {format(parseISO(req.createdAt), "MMM d, yyyy")}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  {req.status === "PENDING" ? (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="soft"
                        className="size-8 text-success hover:bg-success-soft"
                        onClick={() => handleApprove(req)}
                        disabled={isMutating(req.id)}
                      >
                        {isMutating(req.id) ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="soft"
                        className="size-8 text-destructive hover:bg-destructive-soft"
                        onClick={() => setRejectingRequest(req)}
                        disabled={isMutating(req.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
