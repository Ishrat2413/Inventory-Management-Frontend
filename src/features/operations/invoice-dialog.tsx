"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Printer, FileText, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { Task } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDt = (dt?: string | null) => {
  if (!dt) return "—";
  try { return format(parseISO(dt), "MMM d, yyyy hh:mm a"); } catch { return dt; }
};

// ─── Print-window HTML builder ─────────────────────────────────────────────

function buildPrintHtml(task: Task, invoiceProducts: any[], totalAmount: number, employeeNames: string, startedAt: string | null | undefined) {
  const rows = invoiceProducts.map((p: any) => {
    const childRows = (p.isComposite && p.bomComponents?.length)
      ? p.bomComponents.map((c: any) => `
          <tr class="sub">
            <td colspan="2" class="sub-desc">↳ ${c.name}${c.sku ? ` <span class="mono">(${c.sku})</span>` : ""}</td>
            <td class="right" colspan="2">Qty: ${c.totalQuantityRequired}</td>
          </tr>`).join("")
      : "";

    return `
      <tr class="main-row">
        <td class="product-name">${p.name}${p.sku ? ` <span class="mono">(${p.sku})</span>` : ""}</td>
        <td class="right">${p.quantity}</td>
        <td class="right">${formatCurrency(p.unitPrice)}</td>
        <td class="right">${formatCurrency(p.unitPrice * p.quantity)}</td>
      </tr>${childRows}`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice — ${task.title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",system-ui,sans-serif;font-size:13px;color:#111;background:#fff;padding:40px}
  .page{max-width:740px;margin:0 auto}
  /* Header */
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #111;margin-bottom:28px}
  .brand-name{font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#4f46e5}
  .brand-sub{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#555;margin-top:4px}
  .brand-meta{font-size:11px;color:#444;margin-top:8px;line-height:1.7}
  .invoice-label{text-align:right}
  .invoice-label h1{font-size:22px;font-weight:800;letter-spacing:2px;text-transform:uppercase}
  .invoice-label p{font-size:11px;color:#444;margin-top:4px;line-height:1.7}
  /* Info grid */
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:28px;border:1px solid #ddd;border-radius:6px;overflow:hidden}
  .info-cell{padding:16px 18px;border-right:1px solid #ddd}
  .info-cell:nth-child(2){border-right:none}
  .info-cell:nth-child(3){border-top:1px solid #ddd;border-right:1px solid #ddd}
  .info-cell:nth-child(4){border-top:1px solid #ddd;border-right:none}
  .info-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:6px}
  .info-value{font-size:13px;font-weight:600;color:#111;display:flex;align-items:center;gap:6px}
  .info-value.muted{font-weight:400;color:#333}
  .times-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:28px}
  .time-cell{padding:14px 18px;border:1px solid #ddd;margin-right:-1px}
  /* Table */
  .items-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:8px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f4f4f5;border-top:1px solid #ddd;border-bottom:2px solid #ccc}
  thead th{padding:10px 14px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#444;text-align:left}
  th.right,td.right{text-align:right}
  .main-row td{padding:12px 14px;border-bottom:1px solid #eee;font-weight:600;font-size:13px}
  .main-row td:first-child{font-weight:700}
  .sub td{padding:7px 14px 7px 30px;border-bottom:1px solid #f0f0f0;color:#555;font-size:12px}
  .sub .sub-desc{font-size:12px}
  .mono{font-family:monospace;font-size:10px;color:#888;font-weight:400}
  /* Total */
  .total-row{display:flex;justify-content:flex-end;margin-top:20px}
  .total-box{border-top:2px solid #111;padding-top:12px;min-width:260px;display:flex;justify-content:space-between;align-items:center}
  .total-label{font-size:13px;font-weight:700}
  .total-amount{font-size:22px;font-weight:900;color:#4f46e5}
  /* Footer */
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:10px;color:#888}
  @media print{body{padding:20px}button{display:none}}
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-name">INVENTORY MANAGEMENT</div>
      <div class="brand-sub">Task &amp; Production Tracking System</div>
      <div class="brand-meta">
        <strong>Task Ref:</strong> ${task.id}<br/>
        <strong>Status:</strong> ${task.status}
      </div>
    </div>
    <div class="invoice-label">
      <h1>Invoice</h1>
      <p><strong>Date:</strong> ${formatDt(task.createdAt)}</p>
      ${task.completedAt ? `<p><strong>Completed:</strong> ${formatDt(task.completedAt)}</p>` : ""}
    </div>
  </div>

  <!-- Info Grid -->
  <div class="info-grid">
    <div class="info-cell">
      <div class="info-label">Assigned by (Admin)</div>
      <div class="info-value">${task.createdBy?.name ?? "Admin"}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Performed by (Employee)</div>
      <div class="info-value">${employeeNames || "Unassigned"}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Task Description</div>
      <div class="info-value muted">${task.description ?? "—"}</div>
    </div>
    <div class="info-cell" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>
        <div class="info-label">Started At</div>
        <div class="info-value muted">${formatDt(startedAt)}</div>
      </div>
      <div>
        <div class="info-label">Completed At</div>
        <div class="info-value muted">${formatDt(task.completedAt)}</div>
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="items-label">Line Items</div>
  <table>
    <thead>
      <tr>
        <th style="width:50%">Product Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit Cost</th>
        <th class="right">Total Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Grand Total -->
  <div class="total-row">
    <div class="total-box">
      <span class="total-label">Grand Total</span>
      <span class="total-amount">${formatCurrency(totalAmount)}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Generated by Inventory Management System</span>
    <span>${format(new Date(), "MMM d, yyyy hh:mm a")}</span>
  </div>
</div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!task) return null;

  const invoiceProducts: any[] = task.productsSnapshot && Array.isArray(task.productsSnapshot)
    ? task.productsSnapshot as any[]
    : task.requiredProducts.map((rp) => {
        const prod = rp.product as any;
        return {
          productId: rp.productId,
          name: prod?.name ?? "Unknown",
          sku: prod?.sku ?? null,
          quantity: Number(rp.quantity),
          unitPrice: Number(prod?.unitPrice ?? 0),
          isComposite: Boolean(prod?.isComposite ?? false),
          bomComponents: [],
        };
      });

  const totalAmount = invoiceProducts.reduce((sum, p: any) => sum + Number(p.unitPrice ?? 0) * Number(p.quantity ?? 0), 0);
  const employeeNames = task.assignments.map((a) => a.employee.name ?? a.employee.email).join(", ");
  const startedAt = (task as any).startedAt || task.createdAt;

  const handlePrint = () => {
    const html = buildPrintHtml(task, invoiceProducts, totalAmount, employeeNames, startedAt);

    // Create a hidden iframe — print inside it so no extra tab/window appears
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for styles/fonts to load, then print and remove the iframe
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh] p-0 overflow-hidden">
        {/* ── Sticky header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <DialogTitle className="text-lg">Generate Invoice</DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Preview and print the invoice statement for this task.
              </DialogDescription>
            </DialogHeader>
          </div>
          <Button onClick={handlePrint} size="sm" className="gap-2 shrink-0 ml-6 mt-6">
            <Printer className="size-3" /> Print / PDF
          </Button>
        </div>

        {/* ── Scrollable invoice preview ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="border border-border rounded-xl overflow-hidden bg-card text-card-foreground">
            {/* Brand header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-primary">INVENTORY MANAGEMENT</h2>
                <p className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground mt-1">Task &amp; Production Tracking System</p>
                <div className="text-xs text-muted-foreground mt-3 space-y-0.5">
                  <p><span className="font-semibold text-foreground">Task Ref:</span> {task.id}</p>
                  <p><span className="font-semibold text-foreground">Status:</span> <span className="font-semibold text-emerald-500">{task.status}</span></p>
                </div>
              </div>
              <div className="sm:text-right shrink-0 space-y-0.5">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Invoice</h3>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Date:</span> {formatDt(task.createdAt)}</p>
                {task.completedAt && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Completed:</span> {formatDt(task.completedAt)}</p>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Assigned by (Admin)</p>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{task.createdBy?.name ?? "Admin"}</span>
                  </div>
                </div>
                {task.description && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Task Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Performed by (Employee)</p>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{employeeNames || "Unassigned"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Started At</p>
                    <p className="text-xs font-medium text-foreground">{formatDt(startedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Completed At</p>
                    <p className="text-xs font-medium text-foreground">{formatDt(task.completedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="p-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Line Items</p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-foreground w-1/2">Product Description</th>
                      <th className="text-right p-3 text-xs font-semibold text-foreground">Qty</th>
                      <th className="text-right p-3 text-xs font-semibold text-foreground">Unit Cost</th>
                      <th className="text-right p-3 text-xs font-semibold text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceProducts.map((p: any, idx: number) => (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-border/60">
                          <td className="p-3 font-semibold">
                            <span className="flex items-center gap-2">
                              <Package className="size-3.5 text-primary shrink-0" />
                              {p.name}
                              {p.sku && <span className="font-mono text-[10px] text-muted-foreground">({p.sku})</span>}
                            </span>
                          </td>
                          <td className="p-3 text-right tabular-nums">{p.quantity}</td>
                          <td className="p-3 text-right tabular-nums">{formatCurrency(p.unitPrice)}</td>
                          <td className="p-3 text-right tabular-nums font-semibold">{formatCurrency(p.unitPrice * p.quantity)}</td>
                        </tr>
                        {p.isComposite && p.bomComponents?.length > 0 && (
                          <tr className="border-b border-border/40 bg-muted/5">
                            <td colSpan={4} className="px-4 py-3 pl-10">
                              <div className="border-l-2 border-primary/25 pl-3">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Required Products</p>
                                <div className="space-y-1.5">
                                  {p.bomComponents.map((c: any, ci: number) => (
                                    <div key={ci} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground flex items-center gap-1.5">
                                        <span className="text-primary/50">↳</span>
                                        <span className="font-medium text-foreground/80">{c.name}</span>
                                        {c.sku && <span className="font-mono text-[10px] text-muted-foreground/60">({c.sku})</span>}
                                      </span>
                                      <span className="font-medium tabular-nums text-muted-foreground">Qty: {c.totalQuantityRequired}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand total */}
              <div className="flex justify-end mt-5">
                <div className="w-64 border-t-2 border-foreground pt-4 flex items-center justify-between">
                  <span className="text-sm font-bold">Grand Total</span>
                  <span className="text-xl font-black text-primary tabular-nums">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
