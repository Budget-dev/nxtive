// GET/PATCH /api/orders/[orderId] — customer read or authorized admin update
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAdmin, requireUser, tryRequireAdmin } from "@/server/auth";
import { ORDER_STATUS_TRANSITIONS } from "@/constants/order-status";
import type { OrderStatus } from "@/types/order";
import { z } from "zod";

const orderStatusSchema = z.enum([
  "pending",
  "payment_confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
  "refund_initiated",
  "refunded",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    if (!orderId || orderId.length > 160) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const admin = await tryRequireAdmin("orders.view", req);
    const user = admin || await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderDoc.data()!;
    if (!admin && order.userId !== user.uid) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: { id: orderDoc.id, ...order },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[order-read] Error:", error);
    return NextResponse.json({ success: false, error: "Unable to load order" }, { status: 500 });
  }
}

const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  trackingNumber: z.string().trim().min(1).max(160).optional(),
  trackingUrl: z.string().url().max(2048).optional(),
  notes: z.string().trim().max(1000).optional(),
  cancelReason: z.string().trim().max(500).optional(),
  returnReason: z.string().trim().max(500).optional(),
}).strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    if (!orderId || orderId.length > 160) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const admin = await requireAdmin("orders.edit", req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ success: false, error: "Invalid update data" }, { status: 400 });
    }

    const updates = parsed.data;
    if (updates.status === "cancelled" && !admin.permissions.includes("orders.cancel") && admin.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Order cancellation is not authorized" }, { status: 403 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderDoc.data()!;
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt: now };

    if (updates.status) {
      const currentStatus = order.status as OrderStatus;
      const newStatus = updates.status as OrderStatus;
      const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(newStatus)) {
        return NextResponse.json(
          { success: false, error: `Cannot transition from "${currentStatus}" to "${newStatus}"` },
          { status: 400 }
        );
      }

      updateData.status = newStatus;
      updateData.statusHistory = [
        ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
        {
          status: newStatus,
          timestamp: now,
          note: updates.notes || "Status updated by admin",
          updatedBy: admin.uid,
        },
      ];

      if (newStatus === "cancelled") {
        updateData.cancelReason = updates.cancelReason || "Cancelled by admin";
      }
      if (newStatus === "return_requested" && updates.returnReason) {
        updateData.returnReason = updates.returnReason;
      }
      if (newStatus === "refund_initiated") {
        updateData.paymentStatus = "refund_initiated";
      }
      if (newStatus === "refunded") {
        updateData.paymentStatus = "refunded";
      }
    }

    if (updates.trackingNumber) updateData.trackingNumber = updates.trackingNumber;
    if (updates.trackingUrl) updateData.trackingUrl = updates.trackingUrl;
    if (updates.notes) updateData.notes = updates.notes;

    await orderRef.update(updateData);

    await adminDb.collection("admin_logs").add({
      action: "order.update",
      resource: "orders",
      resourceId: orderId,
      adminUid: admin.uid,
      adminEmail: admin.email || "",
      details: JSON.stringify(updates),
      timestamp: now,
    });

    return NextResponse.json({ success: true, data: { id: orderId, ...updateData } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[order-update] Error:", error);
    return NextResponse.json({ success: false, error: "Unable to update order" }, { status: 500 });
  }
}
