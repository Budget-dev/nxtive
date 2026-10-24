// Razorpay webhook receiver — verifies signature server-side, never exposed to client bundle.
// Handles payment.authorized, payment.captured, payment.failed, order.paid, refund.created events.
// Final source of truth for payment status.
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import { getRazorpayAdapter } from "@/server/payments";
import { storeReadCollection, storeUpdateDocument } from "@/lib/firebase/firestore-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[razorpay-webhook] Missing signature header");
      return new Response("Missing signature", { status: 400 });
    }

    // 1. Verify webhook signature using RAZORPAY_WEBHOOK_SECRET
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
    const eventId =
      req.headers.get("x-razorpay-event-id") ||
      event.event_id ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    console.info(`[razorpay-webhook] Received event: ${eventType} (ID: ${eventId})`);

    // 2. Idempotency Check
    if (hasAdminCredentials) {
      const eventRef = adminDb.collection("webhook_events").doc(eventId);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists && eventDoc.data()?.status === "processed") {
        console.info(`[razorpay-webhook] Event ${eventId} was already processed. Returning 200 OK.`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      await eventRef.set(
        {
          eventId,
          eventType,
          receivedAt: new Date().toISOString(),
          status: "processing",
        },
        { merge: true }
      );
    }

    const now = new Date().toISOString();

    // Helper to find order
    const findOrder = async (razorpayOrderId?: string, directOrderId?: string): Promise<any | null> => {
      if (hasAdminCredentials) {
        if (directOrderId) {
          const snap = await adminDb.collection("orders").doc(directOrderId).get();
          if (snap.exists) return { id: snap.id, ref: snap.ref, data: snap.data()! };
        }
        if (razorpayOrderId) {
          const snap = await adminDb
            .collection("orders")
            .where("razorpayOrderId", "==", razorpayOrderId)
            .limit(1)
            .get();
          if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, ref: doc.ref, data: doc.data() };
          }
        }
      }

      // Fallback via store layer
      const allOrders = await storeReadCollection<any>("orders");
      const matched = allOrders.find(
        (o) =>
          (directOrderId && (o.id === directOrderId || o.orderNumber === directOrderId)) ||
          (razorpayOrderId && o.razorpayOrderId === razorpayOrderId)
      );
      return matched ? { id: matched.id, data: matched } : null;
    };

    switch (eventType) {
      case "payment.captured": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id;
        const paymentId = payment.id;
        const paymentMethod = payment.method || "online";

        const orderResult = await findOrder(razorpayOrderId, payment.notes?.orderId);
        if (!orderResult) {
          console.warn(`[razorpay-webhook] No order found for Razorpay order ID ${razorpayOrderId}`);
          break;
        }

        const order = orderResult.data;

        // State guard: if already marked success or refunded, do not overwrite
        if (order.status === "success") {
          console.info(`[razorpay-webhook] Order ${orderResult.id} already marked success. Idempotent skip.`);
          break;
        }
        if (order.status === "refunded") {
          console.warn(`[razorpay-webhook] Order ${orderResult.id} already refunded. Ignoring late capture.`);
          break;
        }

        const updatedOrder = {
          status: "success",
          paymentStatus: "paid",
          razorpayPaymentId: paymentId,
          paymentMethod,
          errorCode: null,
          errorDescription: null,
          updatedAt: now,
          statusHistory: [
            ...(order.statusHistory || []),
            {
              status: "success",
              timestamp: now,
              note: `Payment confirmed via Razorpay webhook (${paymentId})`,
            },
          ],
        };

        if (orderResult.ref) {
          await orderResult.ref.update(updatedOrder);
        } else {
          await storeUpdateDocument("orders", orderResult.id, updatedOrder);
        }

        // Sync user profile
        if (order.userId && order.userId !== "guest" && hasAdminCredentials) {
          try {
            const userRef = adminDb.collection("users").doc(order.userId);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
              const uData = userDoc.data()!;
              await userRef.update({
                ordersCount: (uData.ordersCount || 0) + 1,
                totalSpent: (uData.totalSpent || 0) + (order.total || 0),
                lastActivity: now,
                updatedAt: now,
              });
            }
          } catch (uErr) {
            console.warn("[razorpay-webhook] User profile sync warning:", uErr);
          }
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id;
        const errorCode = payment.error_code || "PAYMENT_FAILED";
        const errorDescription = payment.error_description || "Payment failed at bank/gateway";
        const errorReason = payment.error_reason || "unknown";

        const orderResult = await findOrder(razorpayOrderId, payment.notes?.orderId);
        if (!orderResult) break;

        const order = orderResult.data;

        // CRITICAL: A late "failed" webhook can't overwrite an already-verified "success"
        if (order.status === "success") {
          console.warn(
            `[razorpay-webhook CONFLICT] Late payment.failed received for order ${orderResult.id} which is already in 'success' state. Ignoring failure.`
          );
          break;
        }

        if (order.status === "refunded") break;

        const updatedOrder = {
          status: "failed",
          paymentStatus: "failed",
          errorCode,
          errorDescription,
          errorReason,
          updatedAt: now,
          statusHistory: [
            ...(order.statusHistory || []),
            {
              status: "failed",
              timestamp: now,
              note: `Payment failed (${errorCode}: ${errorDescription})`,
            },
          ],
        };

        if (orderResult.ref) {
          await orderResult.ref.update(updatedOrder);
        } else {
          await storeUpdateDocument("orders", orderResult.id, updatedOrder);
        }
        break;
      }

      case "order.paid": {
        const orderEntity = payload.order?.entity;
        if (!orderEntity) break;

        const razorpayOrderId = orderEntity.id;
        const orderResult = await findOrder(razorpayOrderId, orderEntity.notes?.orderId);
        if (!orderResult) break;

        const order = orderResult.data;
        if (order.status !== "success" && order.status !== "refunded") {
          const updatedOrder = {
            status: "success",
            paymentStatus: "paid",
            updatedAt: now,
            statusHistory: [
              ...(order.statusHistory || []),
              {
                status: "success",
                timestamp: now,
                note: "Order confirmed via order.paid webhook",
              },
            ],
          };
          if (orderResult.ref) {
            await orderResult.ref.update(updatedOrder);
          } else {
            await storeUpdateDocument("orders", orderResult.id, updatedOrder);
          }
        }
        break;
      }

      case "refund.created":
      case "refund.processed": {
        const refund = payload.refund?.entity;
        if (!refund) break;

        const paymentId = refund.payment_id;
        const refundPaise = Number(refund.amount || 0);

        if (hasAdminCredentials) {
          const snap = await adminDb
            .collection("orders")
            .where("razorpayPaymentId", "==", paymentId)
            .limit(1)
            .get();

          if (!snap.empty) {
            const orderDoc = snap.docs[0];
            await orderDoc.ref.update({
              status: "refunded",
              paymentStatus: "refunded",
              refundId: refund.id,
              refundAmount: refundPaise / 100,
              updatedAt: now,
              statusHistory: [
                ...(orderDoc.data().statusHistory || []),
                {
                  status: "refunded",
                  timestamp: now,
                  note: `Refund processed: ${refund.id} (INR ${refundPaise / 100})`,
                },
              ],
            });
          }
        }
        break;
      }

      case "payment.authorized": {
        console.info(`[razorpay-webhook] Payment authorized: ${payload.payment?.entity?.id}`);
        break;
      }

      default:
        console.info(`[razorpay-webhook] Unhandled event acknowledged: ${eventType}`);
    }

    if (hasAdminCredentials) {
      await adminDb.collection("webhook_events").doc(eventId).set(
        {
          status: "processed",
          processedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[razorpay-webhook] Error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
