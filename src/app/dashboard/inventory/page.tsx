"use client";

import * as React from "react";
import { toast } from "sonner";

import { SectionHeader } from "@/components/shared/chart-card";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";

import { useProducts, useDeleteProduct, useLowStockProducts } from "@/hooks/queries/use-products";
import { InventoryToolbar } from "@/features/inventory/inventory-toolbar";
import { InventoryTable } from "@/features/inventory/inventory-table";
import { InventoryGrid } from "@/features/inventory/inventory-grid";
import { LowStockBanner } from "@/features/inventory/low-stock-banner";
import { ProductFormDialog } from "@/features/inventory/product-form-dialog";
import { ProductDetailsDrawer } from "@/features/inventory/product-details-drawer";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Product } from "@/types";

const PAGE_SIZE = 8;

export default function InventoryPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [lowStockOnly, setLowStockOnly] = React.useState(false);
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [page, setPage] = React.useState(1);

  const [viewingProduct, setViewingProduct] = React.useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const { data, isLoading } = useProducts({
    search: search || undefined,
    category: category === "all" ? undefined : category,
    lowStock: lowStockOnly || undefined,
    pageNo: page,
    showPerPage: PAGE_SIZE,
  });
  const { data: lowStockList } = useLowStockProducts();
  const deleteProduct = useDeleteProduct();

  const products = data?.products ?? [];

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setEditOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => toast.success("Product discontinued", { description: `${deletingProduct.name} was removed from active inventory.` }),
      onError: (error) => toast.error("Couldn't discontinue product", { description: getApiErrorMessage(error) }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Inventory management"
        description="Track, add, and update every product in your catalog."
        action={<ProductFormDialog />}
      />

      <LowStockBanner count={lowStockList?.length ?? 0} />

      <Card className="gap-4 py-6">
        <div className="px-6">
          <InventoryToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            category={category}
            onCategoryChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            lowStockOnly={lowStockOnly}
            onLowStockOnlyChange={(v) => {
              setLowStockOnly(v);
              setPage(1);
            }}
            view={view}
            onViewChange={setView}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className={view === "list" ? "" : "px-6"}>
            {view === "list" ? (
              <InventoryTable products={products} onView={setViewingProduct} onEdit={handleEdit} onDelete={setDeletingProduct} />
            ) : (
              <InventoryGrid products={products} onView={setViewingProduct} onEdit={handleEdit} onDelete={setDeletingProduct} />
            )}
          </div>
        )}

        <Pagination
          page={page}
          pageCount={data?.totalPages ?? 1}
          onPageChange={setPage}
          totalItems={data?.totalData ?? 0}
          pageSize={PAGE_SIZE}
        />
      </Card>

      <ProductDetailsDrawer
        product={viewingProduct}
        open={!!viewingProduct}
        onOpenChange={(open) => !open && setViewingProduct(null)}
        onEdit={handleEdit}
      />

      <ProductFormDialog
        product={editingProduct ?? undefined}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingProduct(null);
        }}
        trigger={null}
      />

      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Discontinue this product?"
        description={`"${deletingProduct?.name}" will be marked discontinued and hidden from active inventory. This can't be undone from the UI.`}
        confirmLabel="Discontinue product"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
