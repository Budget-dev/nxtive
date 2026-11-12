import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import { storeReadDocument, storeUpdateDocument } from "@/lib/firebase/firestore-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, errorCode, errorDescription } = body || {};

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const code = String(errorCode || "PAYMENT_FAILED");
    const desc = String(errorDescription || "Payment was declined or cancelled by customer.");

    if (hasAdminCredentials) {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const snap = await orderRef.get();
      if (snap.exists) {
        const data = snap.data();
        // Never mark an already paid order as failed!
        if (data?.paymentStatus === "paid" || data?.status === "paid") {
          return NextResponse.json({ success: true, message: "Order is already paid." });
        }

        const currentHistory = Array.isArray(data?.statusHistory) ? data?.statusHistory : [];
        await orderRef.update({
          status: "failed",
          paymentStatus: "failed",
          errorCode: code,
          errorDescription: desc,
          updatedAt: now,
          statusHistory: [
            ...currentHistory,
            {
              status: "failed",
              timestamp: now,
              note: `Payment failed (${code}): ${desc}`,
              updatedBy: "client",
            },
          ],
        });
        return NextResponse.json({ success: true, orderId });
      }
    }

    // Fallback store update
    const order = await storeReadDocument<any>("orders", orderId);
    if (order) {
      if (order.paymentStatus === "paid" || order.status === "paid") {
        return NextResponse.json({ success: true, message: "Order is already paid." });
      }
      const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      await storeUpdateDocument("orders", orderId, {
        status: "failed",
        paymentStatus: "failed",
        errorCode: code,
        errorDescription: desc,
        updatedAt: now,
        statusHistory: [
          ...currentHistory,
          {
            status: "failed",
            timestamp: now,
            note: `Payment failed (${code}): ${desc}`,
            updatedBy: "client",
          },
        ],
      });
      return NextResponse.json({ success: true, orderId });
    }

    return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
  } catch (err: any) {
    console.error("[razorpay-record-failure] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

