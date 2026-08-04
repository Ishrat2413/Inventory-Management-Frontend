"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/shared/initials-avatar";
import { ProductStockBadge } from "@/components/shared/status-badges";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import { Pencil } from "lucide-react";

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
  if (!product) return null;

  const category = (product.customFields?.category as string) ?? "Uncategorized";
  const stockValue = Number(product.currentStock) * Number(product.unitPrice);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Product details</SheetTitle>
          <SheetDescription>Full overview of this inventory item.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-6">
          <div className="flex items-center gap-4">
            <ProductThumb name={product.name} size="size-16" className="rounded-2xl text-base" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-muted-foreground text-sm">{product.sku ?? "No SKU"}</p>
              <ProductStockBadge currentStock={Number(product.currentStock)} lowStockThreshold={product.lowStockThreshold ? Number(product.lowStockThreshold) : null} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Category" value={category} />
            <Field label="Vendor" value={product.vendor?.name ?? "—"} />
            <Field label="Quantity" value={`${product.currentStock} units`} />
            <Field label="Created" value={formatDate(product.createdAt)} />
            <Field label="Unit price" value={formatCurrency(Number(product.unitPrice))} />
            <Field label="Composite" value={product.isComposite ? "Yes (has BOM)" : "No"} />
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-muted-foreground text-xs">Current stock value</p>
            <p className="tabular mt-1 text-xl font-semibold">{formatCurrency(stockValue)}</p>
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
              onEdit(product);
            }}
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
      <span className="font-medium">{value}</span>
    </div>
  );
}
