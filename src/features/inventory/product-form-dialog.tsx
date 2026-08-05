"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Save, Tag } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateProduct, useUpdateProduct, useVendors } from "@/hooks/queries/use-products";
import { useCategories } from "@/hooks/queries/use-categories";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Product } from "@/types";

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  unitPrice: z.number().min(0.01, "Enter a valid unit price"),
  currentStock: z.number().int().min(0, "Quantity can't be negative"),
  lowStockThreshold: z.number().int().min(0).optional(),
  vendorId: z.string().optional(),
  isComposite: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductFormDialog({
  product,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  product?: Product;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !!product;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const { data: vendorData } = useVendors();
  const { data: categoriesData } = useCategories();
  const vendors = vendorData?.vendors ?? [];
  const categories = categoriesData?.categories ?? [];

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const loading = createProduct.isPending || updateProduct.isPending;

  const defaultValues = (p?: Product): ProductFormValues => ({
    name: p?.name ?? "",
    sku: p?.sku ?? "",
    categoryId: (p as Product & { categoryId?: string })?.categoryId ?? "",
    unitPrice: p ? Number(p.unitPrice) : 0,
    currentStock: p ? Number(p.currentStock) : 0,
    lowStockThreshold: p?.lowStockThreshold ? Number(p.lowStockThreshold) : undefined,
    vendorId: p?.vendorId ?? undefined,
    isComposite: p?.isComposite ?? false,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues(product),
  });

  React.useEffect(() => {
    if (open) reset(defaultValues(product));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const onSubmit = (values: ProductFormValues) => {
    const payload = {
      name: values.name,
      sku: values.sku || undefined,
      unitPrice: values.unitPrice,
      currentStock: values.currentStock,
      lowStockThreshold: values.lowStockThreshold,
      vendorId: values.vendorId || undefined,
      isComposite: values.isComposite,
      categoryId: values.categoryId || undefined,
      customFields: {},
    };

    const onSuccess = () => {
      toast.success(isEdit ? "Product updated" : "Product added", { description: `${values.name} was saved.` });
      setOpen(false);
    };
    const onError = (error: unknown) => toast.error("Something went wrong", { description: getApiErrorMessage(error) });

    if (isEdit && product) {
      updateProduct.mutate({ id: product.id, payload }, { onSuccess, onError });
    } else {
      createProduct.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : trigger === undefined && !isEdit ? (
        <DialogTrigger asChild>
          <Button>
            <Plus /> Add product
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add new product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details for this product." : "Fill in the details to add a product to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" placeholder="Aurora Wireless Headphones" {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="SKU-2FA91" {...register("sku")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <Tag className="size-3 shrink-0 text-muted-foreground" />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No categories yet — <a href="/dashboard/categories" className="text-primary underline">create one</a>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitPrice">Unit price</Label>
              <Input id="unitPrice" type="number" step="0.01" {...register("unitPrice", { valueAsNumber: true })} />
              {errors.unitPrice && <p className="text-destructive text-xs">{errors.unitPrice.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentStock">Quantity</Label>
              <Input id="currentStock" type="number" {...register("currentStock", { valueAsNumber: true })} />
              {errors.currentStock && <p className="text-destructive text-xs">{errors.currentStock.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lowStockThreshold">Low stock at</Label>
              <Input id="lowStockThreshold" type="number" placeholder="5" {...register("lowStockThreshold", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Vendor</Label>
            <Select value={watch("vendorId") ?? ""} onValueChange={(v) => setValue("vendorId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select vendor (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No vendor</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Composite product</p>
              <p className="text-muted-foreground text-xs">Assembled from other products via a Bill of Materials</p>
            </div>
            <Switch checked={watch("isComposite")} onCheckedChange={(v) => setValue("isComposite", v)} />
          </label>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isEdit ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
