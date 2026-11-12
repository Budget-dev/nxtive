// Shared TypeScript types for the "order" domain.

export type OrderStatus =
  | "pending"
  | "payment_confirmed"
  | "paid"
  | "created"
  | "failed"
  | "verification_failed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refund_initiated"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refund_initiated"
  | "refunded"
  | "cod_pending";

export interface OrderItem {
  productId: string;
  title: string;
  slug?: string;
  sku?: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string; // admin uid or "system"
}

export interface Order {
  id: string;
  orderNumber: string; // human-readable e.g. NX-2026-94812
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusEntry[];
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: ShippingAddress;
  deliveryMethod: string;
  deliveryDateEstimate?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  idempotencyKey?: string;
  notes?: string;
  cancelReason?: string;
  returnReason?: string;
  refundAmount?: number;
  refundId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight order for list views */
export type OrderSummary = Pick<
  Order,
  | "id"
  | "orderNumber"
  | "userId"
  | "total"
  | "status"
  | "paymentStatus"
  | "createdAt"
  | "items"
>;

