"use server";

import { adminDb } from "@/lib/firebase/admin";
import type { Order } from "@/types/order";
import { requireUser } from "@/server/auth";

/** Get orders for a specific customer */
export async function getCustomerOrders(userId: string): Promise<Order[]> {
  const user = await requireUser();
  if (!user || user.uid !== userId) throw new Error("Unauthorized");
  const snap = await adminDb
    .collection("orders")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
}

/** Get order details by ID for customer view */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const user = await requireUser();
  if (!user) throw new Error("Unauthorized");
  const snap = await adminDb.collection("orders").doc(orderId).get();
  if (!snap.exists || snap.data()?.userId !== user.uid) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

/** Cancel order by customer if still pending or payment_confirmed */
export async function cancelCustomerOrder(
  orderId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  if (!user || user.uid !== userId) return { success: false, error: "Unauthorized" };
  const order = await getOrderById(orderId);
  if (!order) return { success: false, error: "Order not found" };

  if (order.status !== "pending" && order.status !== "payment_confirmed") {
    return {
      success: false,
      error: `Order cannot be cancelled as it is already in "${order.status}" status.`,
    };
  }

  const now = new Date().toISOString();
  await adminDb.collection("orders").doc(orderId).update({
    status: "cancelled",
    cancelReason: reason || "Cancelled by customer",
    statusHistory: [
      ...(order.statusHistory || []),
      { status: "cancelled", timestamp: now, note: reason || "Cancelled by customer", updatedBy: user.uid },
    ],
    updatedAt: now,
  });
  return { success: true };
}
