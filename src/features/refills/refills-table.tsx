"use client";

import * as React from "react";
import { toast } from "sonner";
import { ClipboardList, Check, X, Loader2, ChevronDown, ChevronUp, Package, PackageOpen, Zap } from "lucide-react";
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
import { useDecideProductRequest, useIssueProductRequest } from "@/hooks/queries/use-product-requests";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ProductRequest, BOMSnapshot } from "@/types";

// ─── BOM Snapshot Row ─────────────────────────────────────────────────────────

function BOMSnapshotInline({ snapshot }: { snapshot: BOMSnapshot }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!snapshot.bomComponents?.length) return null;

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
      >
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {expanded ? "Hide" : "Show"} components ({snapshot.bomComponents.length})
      </button>
      {expanded && (
        <div className="mt-1.5 border-l-2 border-primary/20 pl-2.5 space-y-1">
          {snapshot.bomComponents.map((c) => (
            <div key={c.productId} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <span className="text-primary/50 mr-1">↳</span>
                <span className="font-medium text-foreground/80">{c.name}</span>
                {c.sku && <span className="font-mono text-[10px] ml-1 opacity-60">({c.sku})</span>}
              </span>
              <span className="font-semibold text-foreground tabular-nums">×{c.totalQuantityRequired}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function RefillsTable({ requests }: { requests: ProductRequest[] }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const decideMutation = useDecideProductRequest();
  const issueMutation = useIssueProductRequest();

  // Rejection state
  const [rejectingRequest, setRejectingRequest] = React.useState<ProductRequest | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  // Fulfill confirm state
  const [fulfillingRequest, setFulfillingRequest] = React.useState<ProductRequest | null>(null);

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

  const handleFulfill = () => {
    if (!fulfillingRequest) return;
    issueMutation.mutate(fulfillingRequest.id, {
      onSuccess: () => {
        toast.success("Request fulfilled", {
          description: "Stock has been added and inventory updated.",
        });
        setFulfillingRequest(null);
      },
      onError: (err) => toast.error("Fulfillment failed", { description: getApiErrorMessage(err) }),
    });
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

  const isDeciding = (id: string) =>
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

      {/* Fulfill Confirm Dialog */}
      <Dialog open={!!fulfillingRequest} onOpenChange={(open) => { if (!open) setFulfillingRequest(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Fulfill refill request</DialogTitle>
            <DialogDescription>
              This will add the requested stock to inventory. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {fulfillingRequest && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                {fulfillingRequest.product?.isComposite
                  ? <PackageOpen className="size-3.5 text-primary shrink-0" />
                  : <Package className="size-3.5 text-muted-foreground shrink-0" />}
                {fulfillingRequest.product?.name}
              </div>
              <p className="text-muted-foreground text-xs">
                Quantity: <span className="font-semibold text-foreground">×{Number(fulfillingRequest.quantity)}</span>
              </p>
              {/* Show stored snapshot components if available */}
              {fulfillingRequest.bomSnapshot && fulfillingRequest.bomSnapshot.bomComponents?.length > 0 && (
                <div className="pt-1 border-t border-border/50 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Will deduct from stock:</p>
                  <div className="space-y-1">
                    {fulfillingRequest.bomSnapshot.bomComponents.map((c) => (
                      <div key={c.productId} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          <span className="text-primary/50 mr-1">↳</span>{c.name}
                        </span>
                        <span className="font-semibold tabular-nums">×{c.totalQuantityRequired}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFulfillingRequest(null)}>Cancel</Button>
            <Button
              onClick={handleFulfill}
              disabled={issueMutation.isPending}
              className="gap-2"
            >
              {issueMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
              Confirm Fulfillment
            </Button>
          </DialogFooter>
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
                <div className="flex items-start gap-1.5">
                  {req.product?.isComposite
                    ? <PackageOpen className="size-3.5 text-primary shrink-0 mt-0.5" />
                    : <Package className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold">{req.product?.name}</p>
                    <p className="text-xs text-muted-foreground tabular">SKU: {req.product?.sku || "—"}</p>
                    {/* BOM snapshot — visible for compound products */}
                    {req.bomSnapshot && <BOMSnapshotInline snapshot={req.bomSnapshot} />}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-semibold tabular text-foreground">
                {Number(req.quantity)}
              </TableCell>
              <TableCell>
                <RequestStatusBadge status={req.status} isFulfilled={req.stockMovements && req.stockMovements.length > 0} />
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
                        disabled={isDeciding(req.id)}
                        title="Approve"
                      >
                        {isDeciding(req.id) ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="soft"
                        className="size-8 text-destructive hover:bg-destructive-soft"
                        onClick={() => setRejectingRequest(req)}
                        disabled={isDeciding(req.id)}
                        title="Reject"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : req.status === "APPROVED" && !(req.stockMovements && req.stockMovements.length > 0) ? (
                    <Button
                      size="sm"
                      variant="soft"
                      className="gap-1.5 text-primary hover:bg-primary-soft"
                      onClick={() => setFulfillingRequest(req)}
                      disabled={issueMutation.isPending}
                      title="Fulfill — deduct from inventory"
                    >
                      <Zap className="size-3.5" />
                      Fulfill
                    </Button>
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
