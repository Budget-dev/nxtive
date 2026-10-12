// Shared result types for the Firestore-backed admin dashboard.
//
// This module intentionally contains no seed, mock, or sample records. Admin
// reads must reflect persisted Firestore state only.

import type { Order } from "@/types/order";
import type { Review } from "@/types/review";

export type AdminDataErrorState = "setup" | "error";

export class AdminDataError extends Error {
  constructor(
    public readonly state: AdminDataErrorState,
    message: string
  ) {
    super(message);
    this.name = "AdminDataError";
  }
}

export interface DashboardStats {
  dataState: "ready" | "empty";
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrdersCount: number;
  pendingReviewsCount: number;
  lowStockCount: number;
  averageOrderValue: number;
  recentOrders: Order[];
  pendingReviews: Review[];
  stockOverview: {
    id: string;
    name: string;
    sku: string;
    image: string;
    stock: number;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    price: number;
  }[];
  statusBreakdown: Record<string, number>;
  revenueTrend: { date: string; amount: number; orders: number }[];
}
