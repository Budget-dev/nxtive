// Shared TypeScript types for the "user" domain.

export type UserRole =
  | "customer"
  | "admin"
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "customer_support"
  | "review_manager"
  | "payment_manager"
  | "shipping_manager";

export interface UserAddress {
  id: string;
  label?: string; // "Home", "Office", etc.
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  addresses?: UserAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  accountStatus: "active" | "suspended" | "pending";
  ordersCount: number;
  totalSpent: number;
  registrationDate: string;
  lastActivity: string;
  addresses?: UserAddress[];
  avatarUrl?: string;
  segmentTier?: "Regular" | "New";
  notes?: string;
}

export type AdminPermission =
  // Dashboard
  | "dashboard.view"
  // Products
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  // Orders
  | "orders.view"
  | "orders.edit"
  | "orders.cancel"
  // Customers
  | "customers.view"
  | "customers.edit"
  | "customers.suspend"
  // Reviews
  | "reviews.view"
  | "reviews.approve"
  | "reviews.reject"
  | "reviews.delete"
  // Payments
  | "payments.view"
  | "payments.manage"
  // Shipping
  | "shipping.view"
  | "shipping.manage"
  // Categories
  | "categories.view"
  | "categories.edit"
  // Coupons
  | "coupons.view"
  | "coupons.manage"
  // Admins
  | "admins.view"
  | "admins.manage"
  // Settings
  | "settings.manage";

export interface AdminRoleDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissions: AdminPermission[];
  userCount?: number;
  createdAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string; // role slug e.g. "super_admin" or custom
  roleName?: string;
  permissions: AdminPermission[];
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
}

/** Minimal admin info for audit logs */
export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  adminUid: string;
  adminEmail: string;
  details?: string;
  timestamp: string;
}
