// Razorpay webhook receiver — verifies signature server-side, never exposed to client bundle.
// Handles payment.captured, payment.failed, refund.created events.
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import { getRazorpayAdapter } from "@/server/payments";

export async function POST(req: NextRequest) {
  try {
    if (!hasAdminCredentials) {
      return NextResponse.json({ success: false, error: "Webhook service unavailable" }, { status: 503 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // -- Verify webhook signature --
    const adapter = getRazorpayAdapter();
    const isValid = adapter.validateWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error("[razorpay-webhook] Invalid signature");
      return new Response("Invalid signature", { status: 400 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid payload", { status: 400 });
    }
    const eventType: string = typeof event.event === "string" ? event.event : "";
    const payload = event.payload && typeof event.payload === "object" ? event.payload : {};

    const now = new Date().toISOString();

    switch (eventType) {
      case "payment.captured": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id;
        if (typeof razorpayOrderId !== "string" || typeof payment.id !== "string") break;

        // Update payment record
        const paymentSnap = await adminDb
          .collection("payments")
          .where("razorpayOrderId", "==", razorpayOrderId)
          .limit(1)
          .get();

        if (!paymentSnap.empty) {
          const paymentDoc = paymentSnap.docs[0];
          await paymentDoc.ref.update({
            status: "captured",
            razorpayPaymentId: payment.id,
            method: payment.method || null,
            webhookVerified: true,
            updatedAt: now,
          });

          // If order exists, confirm payment status
          const orderData = paymentDoc.data();
          if (orderData.orderId) {
            const orderRef = adminDb.collection("orders").doc(orderData.orderId);
            const orderSnap = await orderRef.get();
            if (orderSnap.exists) {
              const order = orderSnap.data()!;
               if (order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" && order.paymentStatus !== "refund_initiated") {
                await orderRef.update({
                  paymentStatus: "paid",
                  status: "payment_confirmed",
                  updatedAt: now,
                  statusHistory: [
                    ...(order.statusHistory || []),
                    {
                      status: "payment_confirmed",
                      timestamp: now,
                      note: "Payment confirmed via Razorpay webhook",
                    },
                  ],
                });
              }
            }
          }
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id;
        if (typeof razorpayOrderId !== "string") break;

        const paymentSnap = await adminDb
          .collection("payments")
          .where("razorpayOrderId", "==", razorpayOrderId)
          .limit(1)
          .get();

        if (!paymentSnap.empty) {
          await paymentSnap.docs[0].ref.update({
            status: "failed",
            failureReason: payment.error_description || "Payment failed",
            webhookVerified: true,
            updatedAt: now,
          });
        }
        break;
      }

      case "refund.created": {
        const refund = payload.refund?.entity;
        if (!refund) break;

        const paymentId = refund.payment_id;
        const refundPaise = Number(refund.amount);
        if (typeof paymentId !== "string" || typeof refund.id !== "string" || !Number.isInteger(refundPaise) || refundPaise <= 0) break;

        const paymentSnap = await adminDb
          .collection("payments")
          .where("razorpayPaymentId", "==", paymentId)
          .limit(1)
          .get();

        if (!paymentSnap.empty) {
          const paymentDoc = paymentSnap.docs[0];
           await paymentDoc.ref.update({
             status: "refunded",
             refundId: refund.id,
             refundAmount: refundPaise,
             updatedAt: now,
           });

          const paymentData = paymentDoc.data();
          if (paymentData.orderId) {
            const orderRef = adminDb.collection("orders").doc(paymentData.orderId);
            const orderSnap = await orderRef.get();
             if (orderSnap.exists) {
               const order = orderSnap.data()!;
               const orderTotal = Number(order.total);
               const previousRefund = Number(order.refundAmount || 0);
               const refundInr = refundPaise / 100;
               const totalRefunded = Math.round((previousRefund + refundInr) * 100) / 100;
               if (!Number.isFinite(orderTotal) || orderTotal <= 0 || !Number.isFinite(previousRefund) || previousRefund < 0 || totalRefunded > orderTotal) {
                 console.error("[razorpay-webhook] Ignoring refund greater than order total", refund.id);
                 break;
               }
               if (order.refundId === refund.id && order.paymentStatus === "refunded") break;
               const fullyRefunded = totalRefunded >= orderTotal;
               const refundStatus = fullyRefunded ? "refunded" : "refund_initiated";
               await orderRef.update({
                 paymentStatus: refundStatus,
                 status: refundStatus,
                 refundId: refund.id,
                 refundAmount: totalRefunded,
                 updatedAt: now,
                 statusHistory: [
                   ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
                   {
                     status: refundStatus,
                     timestamp: now,
                     note: fullyRefunded ? `Refund processed: ${refund.id}` : `Partial refund processed: ${refund.id}`,
                   },
                 ],
               });
             }
          }
        }
        break;
      }

      default:
        // Acknowledge unhandled events
        console.log(`[razorpay-webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[razorpay-webhook] Error:", error);
    // Return a generic retryable response without exposing exception text.
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
