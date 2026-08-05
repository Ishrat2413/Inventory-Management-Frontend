"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Save } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateProductRequest } from "@/hooks/queries/use-product-requests";
import { useProducts } from "@/hooks/queries/use-products";
import { getApiErrorMessage } from "@/lib/api-client";

const refillRequestSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.string().min(3, "Provide a reason (at least 3 characters)"),
});

type RefillRequestValues = z.infer<typeof refillRequestSchema>;

export function CreateRefillDialog() {
  const [open, setOpen] = React.useState(false);
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

  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (values: RefillRequestValues) => {
    createRequest.mutate(
      {
        productId: values.productId,
        quantity: values.quantity,
        type: "GENERAL", // Employee refill requests are general refills
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="size-4 mr-2" /> Request refill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request product refill</DialogTitle>
          <DialogDescription>
            Request administrators to refill or purchase more stock for a product.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Product</Label>
            <Select value={watch("productId")} onValueChange={(val) => setValue("productId", val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (Stock: {p.currentStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-destructive text-xs">{errors.productId.message}</p>}
          </div>

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
  );
}
