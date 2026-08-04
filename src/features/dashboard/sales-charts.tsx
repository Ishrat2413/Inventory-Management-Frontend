"use client";
import { useState } from "react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyTrend, useInventoryValueReport, useCogsReport } from "@/hooks/queries/use-reports";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "#94A3B8"];

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border-border rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="tabular flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="size-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: {currency ? formatCurrency(p.value) : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

/** Purchases vs COGS over the last 6 months — sourced from GET /reports/monthly. */
export function RevenueOverviewChart() {
  const { data, isLoading } = useMonthlyTrend(6);

  return (
    <ChartCard title="Purchases vs COGS" description="Monthly spend on new stock vs. cost of goods consumed" className="xl:col-span-2">
      {isLoading ? (
        <Skeleton className="h-75 w-full" />
      ) : (
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="purchasesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cogsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v) => formatCurrency(v, true)}
                width={56}
              />
              <Tooltip content={<ChartTooltip currency />} cursor={{ stroke: "var(--border)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
              <Area type="monotone" dataKey="purchases" name="Purchases" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#purchasesFill)" />
              <Area type="monotone" dataKey="cogs" name="COGS" stroke="var(--chart-3)" strokeWidth={2.5} fill="url(#cogsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

/** Inventory value broken down by category — sourced from GET /reports/inventory-value. */
export function TopCategoriesChart() {
  const { data, isLoading } = useInventoryValueReport();
  const entries = Object.entries(data?.byCategory ?? {}).sort((a, b) => b[1] - a[1]);
  const total = data?.total ?? 0;

  return (
    <ChartCard title="Inventory value by category" description="Current stock valuation">
      {isLoading ? (
        <Skeleton className="h-75 w-full" />
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground flex h-75 items-center justify-center text-sm">No inventory data yet</div>
      ) : (
        <div className="flex h-75 w-full flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={entries.map(([category, value]) => ({ category, value }))}
                dataKey="value"
                nameKey="category"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                strokeWidth={0}
              >
                {entries.map(([category], i) => (
                  <Cell key={category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0];
                  return (
                    <div className="bg-popover border-border rounded-lg border px-3 py-2 text-xs shadow-lg">
                      <p className="tabular font-medium" style={{ color: p.payload.fill }}>
                        {p.name}: {formatCurrency(Number(p.value))}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 px-2">
            {entries.map(([category, value], i) => (
              <div key={category} className="flex items-center gap-1.5 text-xs">
                <span className="size-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-muted-foreground truncate">{category}</span>
                <span className="tabular ml-auto font-medium">{total ? Math.round((value / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

/** Top consumed products by COGS (last 30 days) — GET /reports/cogs. */
export function RevenueVsTargetChart() {
  // Use a stable date string (e.g., YYYY-MM-DD) initialized once using useState to avoid React impure function warning
  const [from] = useState(() => new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0]);
  const { data, isLoading } = useCogsReport({ from });
  const top = (data?.byProduct ?? []).slice(0, 8);

  return (
    <ChartCard title="Top consumed products" description="Cost of goods consumed — last 30 days" className="xl:col-span-2">
      {isLoading ? (
        <Skeleton className="h-70 w-full" />
      ) : top.length === 0 ? (
        <div className="text-muted-foreground flex h-70 items-center justify-center text-sm">No consumption recorded yet</div>
      ) : (
        <div className="h-70 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top} margin={{ left: -16, right: 8, top: 8 }} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, true)} width={56} />
              <Tooltip content={<ChartTooltip currency />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="cogs" name="COGS" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
