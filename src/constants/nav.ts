import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Inventory", href: "/dashboard/inventory", icon: "Boxes" },
  { label: "Operations", href: "/dashboard/operations", icon: "Truck" },
  { label: "Employees", href: "/dashboard/employees", icon: "Users" },
];

export const NAV_FOOTER_ITEMS: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  { label: "Profile", href: "/dashboard/profile", icon: "UserCircle" },
];

export const DEMO_CREDENTIALS = {
  email: "admin@example.com",
  password: "admin123",
};
