"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ProductThumb } from "@/components/shared/initials-avatar";
import { ProductStockBadge } from "@/components/shared/status-badges";
import { ProductRowActions } from "./product-row-actions";
import { EmptyState } from "@/components/shared/states";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import { PackageSearch } from "lucide-react";

export function InventoryTable({
  products,
  onView,
  onEdit,
  onDelete,
}: {
  products: Product[];
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try adjusting your search or filters to find what you're looking for."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => {
          const category = (p.customFields?.category as string) ?? "Uncategorized";
          const threshold = p.lowStockThreshold ? Number(p.lowStockThreshold) : null;
          return (
            <TableRow key={p.id} className="cursor-pointer" onClick={() => onView(p)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <ProductThumb name={p.name} />
                  <div className="flex flex-col">
                    <span className="max-w-[200px] truncate font-medium">{p.name}</span>
                    <span className="text-muted-foreground text-xs">{p.sku ?? "No SKU"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{category}</TableCell>
              <TableCell className="tabular font-medium">{formatCurrency(Number(p.unitPrice))}</TableCell>
              <TableCell className="tabular">{p.currentStock} units</TableCell>
              <TableCell className="text-muted-foreground max-w-[150px] truncate">{p.vendor?.name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
              <TableCell>
                <ProductStockBadge currentStock={Number(p.currentStock)} lowStockThreshold={threshold} />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <ProductRowActions product={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
