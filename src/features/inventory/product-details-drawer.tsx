"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Hammer, AlertTriangle, Loader2 } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/shared/initials-avatar";
import { ProductStockBadge } from "@/components/shared/status-badges";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useProduct, useAssembleProduct } from "@/hooks/queries/use-products";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Product } from "@/types";

export function ProductDetailsDrawer({
  product,
  open,
  onOpenChange,
  onEdit,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: Product) => void;
}) {
  const [assembleOpen, setAssembleOpen] = React.useState(false);
  const [assembleQty, setAssembleQty] = React.useState(1);
  const [assembleNotes, setAssembleNotes] = React.useState("");

  // Fetch full details including BOM summary
  const { data: fullProduct, isLoading: loadingDetails } = useProduct(open && product ? product.id : null);
  const assembleMutation = useAssembleProduct();

  if (!product) return null;

  // Use the fetched product data if available, otherwise fallback to prop
  const activeProduct = fullProduct ?? product;
  const category = (activeProduct as any).category?.name ?? (activeProduct.customFields?.category as string) ?? "Uncategorized";
  const stockValue = Number(activeProduct.currentStock) * Number(activeProduct.unitPrice);

  // Compute material cost from BOM if composite
  const materialCost = activeProduct.materialCost ?? activeProduct.bomSummary?.reduce(
    (sum, item) => sum + item.unitPrice * item.quantityRequired,
    0
  ) ?? 0;

  // Calculate the maximum number of parent units that can be assembled based on available component stock
  const maxAssemblable = activeProduct.bomSummary && activeProduct.bomSummary.length > 0
    ? Math.min(...activeProduct.bomSummary.map(item => Math.floor(Number(item.currentStock) / item.quantityRequired)))
    : 0;

  const handleAssembleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assembleQty <= 0) return;

    assembleMutation.mutate(
      {
        productId: activeProduct.id,
        quantity: assembleQty,
        notes: assembleNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Assembly completed", {
            description: `Successfully assembled ${assembleQty} units of ${activeProduct.name}.`,
          });
          setAssembleOpen(false);
          setAssembleQty(1);
          setAssembleNotes("");
        },
        onError: (err) => {
          toast.error("Assembly failed", {
            description: getApiErrorMessage(err),
          });
        },
      }
    );
  };

  // Check if current input quantity exceeds stock for any component
  const hasStockErrors = activeProduct.bomSummary?.some(
    (item) => item.quantityRequired * assembleQty > Number(item.currentStock)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Product details</SheetTitle>
          <SheetDescription>Full overview of this inventory item.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          {/* Header Card */}
          <div className="flex items-center gap-4">
            <ProductThumb name={activeProduct.name} size="size-16" className="rounded-2xl text-base" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground">{activeProduct.name}</p>
              <p className="text-muted-foreground text-sm">{activeProduct.sku ?? "No SKU"}</p>
              <ProductStockBadge
                currentStock={Number(activeProduct.currentStock)}
                lowStockThreshold={activeProduct.lowStockThreshold ? Number(activeProduct.lowStockThreshold) : null}
              />
            </div>
          </div>

          <Separator />

          {/* Details fields */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Category" value={category} />
            <Field label="Vendor" value={activeProduct.vendor?.name ?? "—"} />
            <Field label="Quantity" value={`${activeProduct.currentStock} units`} />
            <Field label="Created" value={formatDate(activeProduct.createdAt)} />
            <Field label="Selling price" value={formatCurrency(Number(activeProduct.unitPrice))} />
            <Field label="Type" value={activeProduct.isComposite ? "Compound Product" : "Normal Product"} />
          </div>

          <Separator />

          {/* Current Stock Value */}
          <div className="bg-muted/50 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-muted-foreground text-xs">Current stock value</p>
              <p className="tabular mt-1 text-xl font-semibold">{formatCurrency(stockValue)}</p>
            </div>
            {activeProduct.isComposite && (
              <div className="text-right flex flex-col gap-1.5">
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Material Cost (Unit)</p>
                  <p className="tabular text-xs font-medium text-muted-foreground mt-0.5">{formatCurrency(materialCost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Material Cost (Stock)</p>
                  <p className="tabular text-sm font-bold text-primary mt-0.5">{formatCurrency(materialCost * Number(activeProduct.currentStock))}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bill of Materials Summary if Composite */}
          {activeProduct.isComposite && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Bill of Materials</p>
                <span className="text-xs text-muted-foreground">Max assemblable: {maxAssemblable} units</span>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center p-6 bg-muted/20 border rounded-lg">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : activeProduct.bomSummary && activeProduct.bomSummary.length > 0 ? (
                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase">
                        <th className="p-2">Component</th>
                        <th className="p-2 text-right">Required</th>
                        <th className="p-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProduct.bomSummary.map((item) => {
                        const requiredQty = item.quantityRequired;
                        const availStock = Number(item.currentStock);
                        const isShort = availStock < requiredQty;

                        return (
                          <tr key={item.childProductId} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-2">
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-37.5">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground">{item.sku ?? "—"}</span>
                              </div>
                            </td>
                            <td className="p-2 text-right font-medium">{requiredQty} units</td>
                            <td className={cn("p-2 text-right font-semibold", isShort ? "text-destructive" : "text-muted-foreground")}>
                              {availStock} units
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center p-4 bg-muted/20 rounded-lg">No component specifications loaded.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-6 border-t bg-background flex flex-row items-center gap-2 justify-end">
          {activeProduct.isComposite && (
            <Dialog open={assembleOpen} onOpenChange={setAssembleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-initial">
                  <Hammer className="size-4" /> Assemble
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <form onSubmit={handleAssembleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Assemble {activeProduct.name}</DialogTitle>
                    <DialogDescription>
                      Specify the quantity to assemble. Component stocks will be deducted dynamically.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="assembleQty">Assembly Quantity (units)</Label>
                      <Input
                        id="assembleQty"
                        type="number"
                        min={1}
                        value={assembleQty}
                        onChange={(e) => setAssembleQty(parseInt(e.target.value, 10) || 1)}
                        required
                      />
                      <span className="text-xs text-muted-foreground">Max possible assembly based on stock: {maxAssemblable} units</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="assembleNotes">Notes</Label>
                      <Input
                        id="assembleNotes"
                        placeholder="Manual assembly run..."
                        value={assembleNotes}
                        onChange={(e) => setAssembleNotes(e.target.value)}
                      />
                    </div>

                    {/* Stock requirements calculation */}
                    <div className="border border-border rounded-lg p-3 bg-muted/20 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Material Stock Check</p>
                      {activeProduct.bomSummary?.map((item) => {
                        const totalReq = item.quantityRequired * assembleQty;
                        const avail = Number(item.currentStock);
                        const ok = avail >= totalReq;

                        return (
                          <div key={item.childProductId} className="flex justify-between text-xs items-center">
                            <span className="truncate max-w-50 text-muted-foreground">{item.name}</span>
                            <span className={cn("font-medium", ok ? "text-green-600" : "text-destructive flex items-center gap-1")}>
                              {!ok && <AlertTriangle className="size-3" />}
                              Need {totalReq} (Have {avail})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAssembleOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={assembleMutation.isPending || hasStockErrors}>
                      {assembleMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Hammer className="size-4" />
                      )}
                      Confirm Assembly
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Button
            onClick={() => {
              onOpenChange(false);
              onEdit(activeProduct);
            }}
            className="flex-1 sm:flex-initial"
          >
            <Pencil className="size-4" /> Edit product
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
