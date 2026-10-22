// Order/payment/delivery status enums used across features.

import type { OrderStatus, PaymentStatus } from "@/types/order";
import type { ShipmentStatus } from "@/types/delivery";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  payment_confirmed: "Payment Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
  refund_initiated: "Refund Initiated",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#D97706",
  payment_confirmed: "#2563EB",
  processing: "#7C3AED",
  packed: "#6D28D9",
  shipped: "#0891B2",
  out_for_delivery: "#0D9488",
  delivered: "#16A34A",
  cancelled: "#DC2626",
  return_requested: "#EA580C",
  returned: "#9333EA",
  refund_initiated: "#CA8A04",
  refunded: "#6B7280",
};

/** Valid next statuses from any given status (admin transitions) */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["payment_confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
  payment_confirmed: ["processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
  processing: ["packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
  packed: ["shipped", "out_for_delivery", "delivered", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "shipped", "cancelled"],
  delivered: ["return_requested", "returned", "refunded"],
  cancelled: ["pending", "processing"],
  return_requested: ["returned", "delivered", "refund_initiated", "refunded"],
  returned: ["refund_initiated", "refunded"],
  refund_initiated: ["refunded"],
  refunded: [],
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refund_initiated: "Refund Initiated",
  refunded: "Refunded",
  cod_pending: "COD Pending",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed_delivery: "Delivery Failed",
  returned_to_origin: "Returned to Origin",
};

/** The happy-path order flow shown to customers */
export const CUSTOMER_ORDER_TIMELINE: OrderStatus[] = [
  "pending",
  "payment_confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];
