// GET/PATCH /api/orders/[orderId] — customer read or authorized admin update
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  storeReadDocument,
  storeReadCollection,
  storeUpdateDocument,
} from "@/lib/firebase/firestore-store";
import { AuthError, requireAdmin, requireUser, tryRequireAdmin } from "@/server/auth";
import { ORDER_STATUS_TRANSITIONS } from "@/constants/order-status";
import type { OrderStatus } from "@/types/order";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

    const admin = await tryRequireAdmin("orders.view", req).catch(() => null);
    const user = admin || (await requireUser(req).catch(() => null));

    let order = await storeReadDocument<Record<string, any>>("orders", orderId);
    if (!order) {
      // Try case-insensitive search by id, orderNumber, awb, or trackingNumber
      const all = await storeReadCollection<Record<string, any>>("orders");
      const cleanId = orderId.trim().toLowerCase();
      order =
        all.find(
          (o) =>
            o.id?.toLowerCase() === cleanId ||
            o.orderNumber?.toLowerCase() === cleanId ||
            o.trackingNumber?.toLowerCase() === cleanId ||
            o.awbCode?.toLowerCase() === cleanId
        ) || null;
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Admins receive full order document
    if (admin) {
      return NextResponse.json({
        success: true,
        data: order,
      });
    }

    // Authenticated order owner receives full order document
    const isOwner =
      user &&
      ((order.userId && order.userId === user.uid) ||
        (order.shippingAddress?.email && user.email && order.shippingAddress.email.toLowerCase() === user.email.toLowerCase()));

    if (isOwner) {
      return NextResponse.json({
        success: true,
        data: order,
      });
    }

    // Unauthenticated / guest customer tracking by exact orderId / orderNumber / AWB:
    // Return complete tracking and order summary while sanitizing internal admin/gateway secrets
    const customerPhone = order.shippingAddress?.phone || "";
    const customerEmail = order.shippingAddress?.email || "";
    const maskedPhone = customerPhone.length > 4 ? `******${customerPhone.slice(-4)}` : customerPhone;
    const maskedEmail = customerEmail.includes("@")
      ? `${customerEmail.slice(0, 3)}***@${customerEmail.split("@")[1]}`
      : customerEmail;

    const publicOrder = {
      id: order.id,
      orderNumber: order.orderNumber || order.id,
      items: order.items || [],
      subtotal: order.subtotal ?? order.amount ?? 0,
      discount: order.discount ?? 0,
      shipping: order.shipping ?? 0,
      total: order.total ?? order.totalAmount ?? order.amount ?? 0,
      status: order.status || "pending",
      statusHistory: order.statusHistory || [],
      paymentMethod: order.paymentMethod || "Online Payment",
      paymentStatus: order.paymentStatus || "pending",
      shippingAddress: {
        fullName: order.shippingAddress?.fullName || order.customerName || "Customer",
        email: maskedEmail,
        phone: maskedPhone,
        street: order.shippingAddress?.street || "",
        apartment: order.shippingAddress?.apartment || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        postalCode: order.shippingAddress?.postalCode || "",
        country: order.shippingAddress?.country || "India",
      },
      deliveryMethod: order.deliveryMethod || "Standard Domestic",
      deliveryDateEstimate: order.deliveryDateEstimate || "3-5 Business Days",
      trackingNumber: order.trackingNumber || order.awbCode || "",
      trackingUrl: order.trackingUrl || (order.awbCode ? `https://shiprocket.co/tracking/${order.awbCode}` : ""),
      carrier: order.carrier || "Shiprocket Express",
      awbCode: order.awbCode || order.trackingNumber || "",
      cancelReason: order.cancelReason || undefined,
      createdAt: order.createdAt || "",
      updatedAt: order.updatedAt || "",
    };

    return NextResponse.json({
      success: true,
      data: publicOrder,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[order-read] Error:", error);
    return NextResponse.json({ success: false, error: "Unable to load order" }, { status: 500 });
  }
}

const updateOrderSchema = z
  .object({
    status: orderStatusSchema.optional(),
    paymentStatus: z
      .enum(["pending", "paid", "failed", "cancelled", "refund_initiated", "refunded", "cod_pending"])
      .optional(),
    trackingNumber: z.union([z.string().trim().min(1).max(160), z.literal(""), z.null()]).optional(),
    trackingUrl: z.union([z.string().trim().url().max(2048), z.literal(""), z.null()]).optional(),
    notes: z.string().trim().max(1000).optional(),
    cancelReason: z.string().trim().max(500).optional(),
    returnReason: z.string().trim().max(500).optional(),
  })
  .strict();

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
    if (
      updates.status === "cancelled" &&
      !admin.permissions.includes("orders.cancel") &&
      admin.role !== "super_admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Order cancellation is not authorized" },
        { status: 403 }
      );
    }

    let order = await storeReadDocument<Record<string, any>>("orders", orderId);
    if (!order) {
      const all = await storeReadCollection<Record<string, any>>("orders");
      order = all.find((o) => o.orderNumber === orderId || o.id === orderId) || null;
    }
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const resolvedId = order.id || orderId;
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt: now };

    if (updates.status) {
      const currentStatus = order.status as OrderStatus;
      const newStatus = updates.status as OrderStatus;
      const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(newStatus) && newStatus !== currentStatus && admin.role !== "super_admin") {
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
          note: updates.notes || `Status updated to ${newStatus} by admin`,
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
      if (newStatus === "delivered" && (order.paymentStatus === "cod_pending" || order.paymentMethod?.toLowerCase().includes("cash"))) {
        updateData.paymentStatus = "paid";
      }
    }

    if (updates.paymentStatus) {
      updateData.paymentStatus = updates.paymentStatus;
    }
    if (updates.trackingNumber !== undefined) updateData.trackingNumber = updates.trackingNumber || "";
    if (updates.trackingUrl !== undefined) updateData.trackingUrl = updates.trackingUrl || "";
    if (updates.notes !== undefined) updateData.notes = updates.notes || "";

    await storeUpdateDocument("orders", resolvedId, updateData);

    return NextResponse.json({ success: true, data: { id: resolvedId, ...order, ...updateData } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[order-update] Error:", error);
    return NextResponse.json({ success: false, error: "Unable to update order" }, { status: 500 });
  }
}
