"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateTask } from "@/hooks/queries/use-tasks";
import { useUsers } from "@/hooks/queries/use-users";
import { useProducts } from "@/hooks/queries/use-products";
import { getApiErrorMessage } from "@/lib/api-client";

interface RequiredProductRow {
  productId: string;
  quantity: number;
}

export function CreateTaskDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<RequiredProductRow[]>([]);

  const { data: employeesData } = useUsers({ role: "EMPLOYEE", showPerPage: 100 });
  const { data: productsData } = useProducts({ showPerPage: 100 });
  const createTask = useCreateTask();

  const employees = employeesData?.users ?? [];
  const products = productsData?.products ?? [];

  const reset = () => {
    setTitle("");
    setDescription("");
    setSelectedEmployees([]);
    setRows([]);
  };

  const addRow = () => setRows((r) => [...r, { productId: "", quantity: 1 }]);
  const updateRow = (i: number, patch: Partial<RequiredProductRow>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const requiredProducts = rows.filter((r) => r.productId && r.quantity > 0);

    createTask.mutate(
      { title, description: description || undefined, assignedEmployeeIds: selectedEmployees, requiredProducts },
      {
        onSuccess: () => {
          toast.success("Task created", { description: `"${title}" is now pending.` });
          setOpen(false);
          reset();
        },
        onError: (error) => toast.error("Couldn't create task", { description: getApiErrorMessage(error) }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>Assign employees and required products for this work order.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Assemble 20 pcs of 20A Chargers" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Full assembly + basic test" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Assign employees</Label>
            <ScrollArea className="border-border h-32 rounded-lg border p-2">
              <div className="flex flex-col gap-2">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedEmployees.includes(emp.id)}
                      onCheckedChange={(v) =>
                        setSelectedEmployees((prev) => (v ? [...prev, emp.id] : prev.filter((id) => id !== emp.id)))
                      }
                    />
                    {emp.name ?? emp.email}
                  </label>
                ))}
                {employees.length === 0 && <p className="text-muted-foreground text-xs">No employees yet.</p>}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Required products</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addRow}>
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select value={row.productId} onValueChange={(v) => updateRow(i, { productId: v })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-20"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
                />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(i)}>
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending && <Loader2 className="size-4 animate-spin" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
