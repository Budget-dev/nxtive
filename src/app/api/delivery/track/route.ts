import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { storeReadDocument, storeReadCollection } from "@/lib/firebase/firestore-store";
import { requireUser, tryRequireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const awb = searchParams.get("awb");

    if (!orderId && !awb) {
      return NextResponse.json(
        { success: false, error: "Please provide an orderId or awb number." },
        { status: 400 }
      );
    }

    let order: any = null;

    if (orderId) {
      order = await storeReadDocument("orders", orderId);
      if (!order) {
        const orders = await storeReadCollection<any>("orders");
        const cleanId = orderId.trim().toLowerCase();
        order = orders.find(
          (o) =>
            o.id?.toLowerCase() === cleanId ||
            o.orderNumber?.toLowerCase() === cleanId ||
            o.trackingNumber?.toLowerCase() === cleanId ||
            o.awbCode?.toLowerCase() === cleanId
        );
      }
    } else if (awb) {
      const orders = await storeReadCollection<any>("orders");
      const cleanAwb = awb.trim().toLowerCase();
      order = orders.find(
        (o) =>
          o.awbCode?.toLowerCase() === cleanAwb ||
          o.trackingNumber?.toLowerCase() === cleanAwb
      );
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Shipment not found." }, { status: 404 });
    }

    // Auth check: Admin can track all; signed-in users can track their own; or if query has customer phone/email match
    const user = await requireUser(req).catch(() => null);
    const admin = await tryRequireAdmin(undefined, req).catch(() => null);

    if (!admin) {
      const orderOwnerUid = order.uid || order.userId;
      if (user && orderOwnerUid && orderOwnerUid !== "guest" && orderOwnerUid !== user.uid) {
        return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
      }
    }

    // Build timeline stages
    const stages = [
      { key: "pending", label: "Order Placed", description: "Order received by NXTIVE team" },
      { key: "processing", label: "Payment Confirmed", description: "Payment verified, prepared for packaging" },
      { key: "packed", label: "Quality Checked & Packed", description: "Sealed in protective apparel garment bag" },
      { key: "shipped", label: "Dispatched with Courier", description: "Handed over to logistics carrier" },
      { key: "out_for_delivery", label: "Out for Delivery", description: "Courier executive on the way" },
      { key: "delivered", label: "Delivered", description: "Package safely delivered to customer" },
    ];

    const currentStatus = order.status || "pending";
    const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];

    const timeline = stages.map((st) => {
      const historyMatch = statusHistory.find((h: any) => h.status === st.key);
      const isDelivered = currentStatus === "delivered";
      const isCancelled = currentStatus === "cancelled";

      const orderStages = ["pending", "processing", "packed", "shipped", "out_for_delivery", "delivered"];
      const currentIndex = orderStages.indexOf(currentStatus);
      const stageIndex = orderStages.indexOf(st.key);

      const isCompleted = isCancelled ? false : currentIndex >= stageIndex;
      const isCurrent = currentStatus === st.key;

      return {
        key: st.key,
        label: st.label,
        description: historyMatch?.note || st.description,
        timestamp: historyMatch?.timestamp || (isCompleted && isCurrent ? order.updatedAt : null),
        completed: isCompleted,
        current: isCurrent,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: currentStatus,
        paymentStatus: order.paymentStatus,
        carrier: order.carrier || "Blue Dart Express",
        awbCode: order.awbCode || order.trackingNumber || null,
        trackingUrl: order.trackingUrl || (order.awbCode ? `https://shiprocket.co//tracking/${order.awbCode}` : null),
        deliveryMethod: order.deliveryMethod || "Standard Domestic",
        deliveryDateEstimate: order.deliveryDateEstimate || "3-5 Business Days",
        destinationCity: order.shippingAddress?.city || "India",
        statusHistory,
        timeline,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Track error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Tracking lookup failed." }, { status: 500 });
  }
}
