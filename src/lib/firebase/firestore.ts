// Firestore helpers for orders and products.
// Uses the client Firebase SDK (safe for browser).

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "./client";

// ─── Order types ───────────────────────────────────────────────

export interface FirestoreOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  image: string;
}

export interface FirestoreShippingAddress {
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

export interface FirestoreOrder {
  userId: string;
  items: FirestoreOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "Order Confirmed" | "Processing" | "Shipped" | "Delivered";
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending COD";
  shippingAddress: FirestoreShippingAddress;
  deliveryDateEstimate: string;
  trackingNumber: string;
  idempotencyKey: string;
  createdAt: any;
}

// ─── Create order ──────────────────────────────────────────────

export async function createOrder(
  order: Omit<FirestoreOrder, "createdAt">
): Promise<string> {
  // Check for duplicate using idempotency key
  const dupeQuery = query(
    collection(db, "orders"),
    where("userId", "==", order.userId),
    where("idempotencyKey", "==", order.idempotencyKey),
    limit(1)
  );
  const dupeSnap = await getDocs(dupeQuery);
  if (!dupeSnap.empty) {
    // Return existing order ID to prevent duplicate
    return dupeSnap.docs[0].id;
  }

  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    totalAmount: order.total,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Get order by ID ───────────────────────────────────────────

export async function getOrderById(
  orderId: string
): Promise<(FirestoreOrder & { id: string }) | null> {
  const docSnap = await getDoc(doc(db, "orders", orderId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreOrder & { id: string };
}

// ─── Get orders for a user ─────────────────────────────────────

export async function getUserOrders(
  userId: string
): Promise<(FirestoreOrder & { id: string })[]> {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as (FirestoreOrder & {
    id: string;
  })[];
}
