"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Save, Package, ChevronDown, PackageOpen, Search } from "lucide-react";
import { z } from "zod";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateProductRequest, useBOMPreview } from "@/hooks/queries/use-product-requests";
import { useProducts } from "@/hooks/queries/use-products";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Product } from "@/types";

const refillRequestSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number({ message: "Enter a valid quantity" }).int().min(1, "Quantity must be at least 1"),
  reason: z.string().min(3, "Provide a reason (at least 3 characters)"),
});

type RefillRequestValues = z.infer<typeof refillRequestSchema>;

// ─── BOM Preview Panel ────────────────────────────────────────────────────────

function BOMPreviewPanel({ productId, quantity }: { productId: string; quantity: number }) {
  const { data, isLoading } = useBOMPreview(productId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  if (!data?.isComposite || !data.components?.length) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <PackageOpen className="size-3.5 text-primary shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Required Components (Auto-calculated)
        </p>
      </div>

      <div className="space-y-1.5">
        {/* Parent product line */}
        <div className="flex items-center justify-between text-sm font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <Package className="size-3.5 text-muted-foreground shrink-0" />
            {data.product.name}
            {data.product.sku && (
              <span className="font-mono text-[10px] text-muted-foreground">({data.product.sku})</span>
            )}
          </span>
          <span className="tabular-nums">×{quantity}</span>
        </div>

        {/* Component lines */}
        <div className="border-l-2 border-primary/25 pl-3 ml-1.5 space-y-1.5 pt-1">
          {data.components.map((c) => {
            const calculatedTotal = Number(c.quantityRequiredPerUnit) * quantity;
            return (
              <div key={c.productId} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="text-primary/50">↳</span>
                  <span className="font-medium text-foreground/80">{c.name}</span>
                  {c.sku && (
                    <span className="font-mono text-[10px] text-muted-foreground/60">({c.sku})</span>
                  )}
                </span>
                <span className="font-semibold tabular-nums text-foreground">×{calculatedTotal}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Custom Search Combobox (Built with a Ref-based dropdown list) ─────────────

function ProductCombobox({
  products,
  selected,
  onSelect,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside of this combobox container
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="relative w-full" ref={containerRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal bg-background"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            {selected.isComposite
              ? <PackageOpen className="size-3.5 text-primary shrink-0" />
              : <Package className="size-3.5 text-muted-foreground shrink-0" />}
            <span className="truncate">{selected.name}</span>
            {selected.sku && (
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">({selected.sku})</span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Package className="size-3.5 shrink-0" />
            Select product...
          </span>
        )}
        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No products found.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  // Using onMouseDown to trigger selection before focus/open state changes unmount the elements
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(p);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                >
                  {p.isComposite
                    ? <PackageOpen className="size-3.5 text-primary shrink-0" />
                    : <Package className="size-3.5 text-muted-foreground shrink-0" />}
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{p.name}</span>
                    {p.sku && (
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">({p.sku})</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    Stock: {Number(p.currentStock)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function CreateRefillDialog() {
  const [open, setOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const { data: productsData } = useProducts({ showPerPage: 100 });
  const products = productsData?.products ?? [];

  const createRequest = useCreateProductRequest();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RefillRequestValues>({
    resolver: zodResolver(refillRequestSchema),
    defaultValues: { productId: "", quantity: 1, reason: "" },
  });

  const watchedProductId = watch("productId");
  const watchedQuantity = watch("quantity");

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setValue("productId", product.id, { shouldValidate: true });
  };

  React.useEffect(() => {
    if (open) {
      reset();
      setSelectedProduct(null);
    }
  }, [open, reset]);

  const onSubmit = (values: RefillRequestValues) => {
    createRequest.mutate(
      {
        productId: values.productId,
        quantity: values.quantity,
        type: "GENERAL",
        reason: values.reason,
      },
      {
        onSuccess: () => {
          toast.success("Refill request submitted", {
            description: "Admins have been notified of your request.",
          });
          setOpen(false);
        },
        onError: (err) => toast.error("Request failed", { description: getApiErrorMessage(err) }),
      }
    );
  };

  return (
    <>
      <Button className="cursor-pointer" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-2" /> Request refill
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request product refill</DialogTitle>
            <DialogDescription>
              Request administrators to refill or purchase more stock. Compound products will automatically calculate required components.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {/* Searchable product combobox */}
            <div className="flex flex-col gap-1.5">
              <Label>Product</Label>
              <ProductCombobox
                products={products}
                selected={selectedProduct}
                onSelect={handleSelectProduct}
              />
              {errors.productId && <p className="text-destructive text-xs">{errors.productId.message}</p>}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="refill-qty">Quantity needed</Label>
              <Input
                id="refill-qty"
                type="number"
                min={1}
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-destructive text-xs">{errors.quantity.message}</p>}
            </div>

            {/* BOM Preview — auto-shown for compound products */}
            {watchedProductId && selectedProduct?.isComposite && watchedQuantity >= 1 && (
              <BOMPreviewPanel productId={watchedProductId} quantity={watchedQuantity} />
            )}

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="refill-reason">Reason</Label>
              <Input
                id="refill-reason"
                placeholder="e.g. Short on finished goods for next week"
                {...register("reason")}
              />
              {errors.reason && <p className="text-destructive text-xs">{errors.reason.message}</p>}
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRequest.isPending} className="cursor-pointer">
                {createRequest.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
