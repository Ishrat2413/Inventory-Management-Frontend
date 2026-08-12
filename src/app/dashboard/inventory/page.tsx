"use client";

import * as React from "react";
import { toast } from "sonner";

import { SectionHeader } from "@/components/shared/chart-card";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  
  // Separate paginations for both lists
  const [compoundPage, setCompoundPage] = React.useState(1);
  const [simplePage, setSimplePage] = React.useState(1);

  const [viewingProduct, setViewingProduct] = React.useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  // Fetch Compound Products (BOM)
  const { data: compoundData, isLoading: isCompoundLoading } = useProducts({
    search: search || undefined,
    category: category === "all" ? undefined : category,
    lowStock: lowStockOnly || undefined,
    isComposite: true,
    pageNo: compoundPage,
    showPerPage: PAGE_SIZE,
  });

  // Fetch Normal Products (Simple)
  const { data: simpleData, isLoading: isSimpleLoading } = useProducts({
    search: search || undefined,
    category: category === "all" ? undefined : category,
    lowStock: lowStockOnly || undefined,
    isComposite: false,
    pageNo: simplePage,
    showPerPage: PAGE_SIZE,
  });

  const { data: lowStockList } = useLowStockProducts();
  const deleteProduct = useDeleteProduct();

  const compoundProducts = compoundData?.products ?? [];
  const simpleProducts = simpleData?.products ?? [];

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setEditOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => toast.success("Product deleted", { description: `${deletingProduct.name} was removed from the system.` }),
      onError: (error) => toast.error("Couldn't delete product", { description: getApiErrorMessage(error) }),
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Inventory management"
        description="Track, add, and update every product in your catalog."
        action={<ProductFormDialog />}
      />

      <LowStockBanner count={lowStockList?.length ?? 0} />

      {/* Shared Toolbar / Filters */}
      <Card className="px-6 py-4">
        <InventoryToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setCompoundPage(1);
            setSimplePage(1);
          }}
          category={category}
          onCategoryChange={(v) => {
            setCategory(v);
            setCompoundPage(1);
            setSimplePage(1);
          }}
          lowStockOnly={lowStockOnly}
          onLowStockOnlyChange={(v) => {
            setLowStockOnly(v);
            setCompoundPage(1);
            setSimplePage(1);
          }}
          view={view}
          onViewChange={setView}
        />
      </Card>

      {/* ─── Upper Table: Compound Products (BOM) ─── */}
      <div className="flex flex-col gap-3.5">
        <div className="px-1">
          <h2 className="text-base font-bold tracking-tight text-foreground">Compound Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Finished goods assembled from subcomponents based on configured Bills of Materials (BOM).</p>
        </div>

        <Card className="gap-4 py-6 flex flex-col">
          {isCompoundLoading ? (
            <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className={view === "list" ? "" : "px-6"}>
              {view === "list" ? (
                <InventoryTable products={compoundProducts} onView={setViewingProduct} onEdit={handleEdit} onDelete={setDeletingProduct} />
              ) : (
                <InventoryGrid products={compoundProducts} onView={setViewingProduct} onEdit={handleEdit} onDelete={setDeletingProduct} />
              )}
            </div>
          )}

          <Pagination
            page={compoundPage}
            pageCount={compoundData?.totalPages ?? 1}
            onPageChange={setCompoundPage}
            totalItems={compoundData?.totalData ?? 0}
            pageSize={PAGE_SIZE}
          />
        </Card>
      </div>

      {/* ─── Lower Table: Normal Products (Simple) ─── */}
      <div className="flex flex-col gap-3.5">
        <div className="px-1">
          <h2 className="text-base font-bold tracking-tight text-foreground">Normal Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Raw materials, components, and single standalone inventory items.</p>
        </div>

        <Card className="gap-4 py-6 flex flex-col">
          {isSimpleLoading ? (
            <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className={view === "list" ? "" : "px-6"}>
              {view === "list" ? (
                <InventoryTable products={simpleProducts} onView={setViewingProduct} onEdit={handleEdit} onDelete={setDeletingProduct} />
              ) : (
                <InventoryGrid products={simpleProducts} onView={setViewingProduct} onEdit={handleEdit} onDelete={setDeletingProduct} />
              )}
            </div>
          )}

          <Pagination
            page={simplePage}
            pageCount={simpleData?.totalPages ?? 1}
            onPageChange={setSimplePage}
            totalItems={simpleData?.totalData ?? 0}
            pageSize={PAGE_SIZE}
          />
        </Card>
      </div>

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

