import type { NavItem } from "@/types";

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    ] as NavItem[],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products", href: "/dashboard/inventory", icon: "Boxes" },
      { label: "Categories", href: "/dashboard/categories", icon: "Tag" },
      { label: "Vendors", href: "/dashboard/vendors", icon: "Building2" },
    ] as NavItem[],
  },
  {
    label: "Operations",
    items: [
      { label: "Tasks", href: "/dashboard/operations", icon: "Truck" },
      { label: "Attendance", href: "/dashboard/attendance", icon: "CalendarCheck" },
    ] as NavItem[],
  },
  {
    label: "People",
    items: [
      { label: "Employees", href: "/dashboard/employees", icon: "Users" },
    ] as NavItem[],
  },
];

// Flat list for backward compatibility
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const NAV_FOOTER_ITEMS: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  { label: "Profile", href: "/dashboard/profile", icon: "UserCircle" },
];

export const DEMO_CREDENTIALS = {
  email: "admin@example.com",
  password: "admin123",
};
