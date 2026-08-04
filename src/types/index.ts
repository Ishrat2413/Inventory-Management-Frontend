// ---------- Shared enums (mirrors prisma/schema.prisma on the backend) ----------
export type Role = "ADMIN" | "EMPLOYEE";
export type PayCalculationMode = "HOURLY" | "DAILY_PLUS_OVERTIME";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type StockMovementType = "PURCHASE" | "CONSUMPTION" | "ADJUSTMENT" | "WRITE_OFF" | "RETURN";
export type ProductRequestType = "TASK_RELATED" | "GENERAL";
export type ProductRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceSource = "FINGERPRINT" | "MANUAL";

// ---------- Auth / Users ----------
export interface EmployeeProfile {
  id: string;
  userId: string;
  hourlyRate: string;
  dailyRate: string | null;
  payCalculationMode: PayCalculationMode;
  overtimeMultiplier: string;
  lateGraceMinutes: number;
  earlyLeavePenalty: boolean;
  department: string | null;
  joinDate: string | null;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  employeeProfile?: EmployeeProfile | null;
  estimatedEarnings?: EarningsBreakdown | null;
}

export interface EarningsBreakdown {
  from: string;
  to: string;
  daysWorked: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalEstimatedPay: number;
  payCalculationMode: string;
  currency: string;
}

// ---------- Vendors ----------
export interface Vendor {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---------- Products ----------
export interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unitPrice: string;
  currency: string;
  currentStock: string;
  lowStockThreshold: string | null;
  reorderTimeDays: number | null;
  isComposite: boolean;
  isDiscontinued: boolean;
  negativeSince: string | null;
  vendorId: string | null;
  vendor?: { id: string; name: string } | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  daysNegative?: number;
}

export interface BOMTreeNode {
  productId: string;
  name: string;
  sku: string | null;
  isComposite: boolean;
  quantityRequired: number;
  currentStock: number;
  children: BOMTreeNode[];
}

// ---------- Tasks ----------
export interface TaskAssignment {
  id: string;
  employeeId: string;
  employee: { id: string; name: string | null; email: string };
}

export interface TaskRequiredProduct {
  id: string;
  productId: string;
  quantity: string;
  product: { id: string; name: string; sku: string | null };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdById: string;
  createdBy: { id: string; name: string | null };
  completedById: string | null;
  completedBy?: { id: string; name: string | null } | null;
  completedAt: string | null;
  createdAt: string;
  assignments: TaskAssignment[];
  requiredProducts: TaskRequiredProduct[];
}

// ---------- Product Requests ----------
export interface ProductRequest {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string | null; currentStock: string };
  quantity: string;
  type: ProductRequestType;
  status: ProductRequestStatus;
  taskId: string | null;
  task?: { id: string; title: string; status: TaskStatus } | null;
  requestedById: string;
  requestedBy: { id: string; name: string | null };
  approvedById: string | null;
  approvedBy?: { id: string; name: string | null } | null;
  reason: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// ---------- Attendance ----------
export interface Attendance {
  id: string;
  employeeId: string;
  employee?: { id: string; name: string | null };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  source: AttendanceSource;
  isOverride: boolean;
  calculatedHours: string | null;
  lateMinutes: number;
  earlyMinutes: number;
  notes: string | null;
}

export interface TodayStatus {
  date: string;
  checkedIn: boolean;
  checkedOut: boolean;
  checkIn: string | null;
  checkOut: string | null;
  hoursSoFar: number;
  hourlyRate: number;
  estimatedPaySoFar: number;
}

// ---------- Stock Movements ----------
export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string | null };
  type: StockMovementType;
  quantity: string;
  unitCost: string;
  totalCost: string;
  relatedTaskId: string | null;
  performedBy?: { id: string; name: string | null } | null;
  notes: string | null;
  createdAt: string;
}

// ---------- Reports ----------
export interface SpendingReport {
  from: string;
  to: string;
  purchases: { totalCost: number; totalQuantity: number };
  cogs: { totalCost: number; totalQuantity: number };
  adjustments: { totalCost: number; totalQuantity: number };
  writeOffs: { totalCost: number; totalQuantity: number };
  returns: { totalCost: number; totalQuantity: number };
  currency: string;
}

export interface CogsReport {
  from: string;
  to: string;
  totalCogs: number;
  byProduct: { productId: string; name: string; sku: string | null; quantityConsumed: number; cogs: number }[];
  currency: string;
}

export interface InventoryValueReport {
  total: number;
  byCategory: Record<string, number>;
  currency: string;
  productCount: number;
}

// ---------- Generic list envelope ----------
export interface Paginated<T> {
  totalData: number;
  totalPages: number;
  [key: string]: T[] | number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
