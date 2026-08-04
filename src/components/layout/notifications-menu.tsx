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

const notifications = [
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
    description: "OPS-7231 was delivered by Grace Kim.",
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

export function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="size-[18px]" />
          <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-card" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((n) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
