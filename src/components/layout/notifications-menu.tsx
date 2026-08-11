"use client";

import { Bell, PackageX, TrendingUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const adminNotifications = [
  {
    icon: PackageX,
    tone: "text-warning bg-warning-soft",
    title: "Low stock alert",
    description: "Drift Wireless Mouse has 3 units left.",
    time: "12m ago",
  },
  {
    icon: Truck,
    tone: "text-secondary bg-secondary-soft",
    title: "Delivery completed",
    description: "OPS-7231 was completed by John Doe.",
    time: "48m ago",
  },
  {
    icon: TrendingUp,
    tone: "text-success bg-success-soft",
    title: "Sales milestone",
    description: "Monthly revenue crossed $128,000.",
    time: "2h ago",
  },
];

const employeeNotifications = [
  {
    icon: Truck,
    tone: "text-primary bg-primary-soft",
    title: "New Task Assigned",
    description: "Build 20W Charger task has been assigned to you.",
    time: "5m ago",
  },
  {
    icon: Bell,
    tone: "text-secondary bg-secondary-soft",
    title: "Shift reminder",
    description: "Your operations shift starts in 1 hour.",
    time: "1h ago",
  },
];

export function NotificationsMenu() {
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === "EMPLOYEE";
  const list = isEmployee ? employeeNotifications : adminNotifications;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="size-4.5" />
          {list.length > 0 && (
            <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-card" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.map((n) => (
          <DropdownMenuItem key={n.title} className="items-start gap-3 py-2.5">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", n.tone)}>
              <n.icon className="size-4" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-sm font-medium">{n.title}</span>
              <span className="text-muted-foreground text-xs">{n.description}</span>
              <span className="text-muted-foreground text-[11px]">{n.time}</span>
            </div>
          </DropdownMenuItem>
        ))}
        {list.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No new notifications.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
