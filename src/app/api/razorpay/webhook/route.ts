// POST /api/razorpay/webhook — Server-side Razorpay webhook handler
import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import { storeReadCollection, storeUpdateDocument } from "@/lib/firebase/firestore-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  const reqStart = Date.now();
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-razorpay-signature") ||
      (req.headers as any).get?.("X-Razorpay-Signature");

    if (!signature) {
      console.error("[razorpay-webhook] Missing X-Razorpay-Signature header");
      return new Response("Missing signature", { status: 400 });
    }

    // 1. Verify Webhook Signature using Webhook Secret
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (secret) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const expected = Buffer.from(expectedSignature, "utf8");
      const received = Buffer.from(signature, "utf8");

      const isSignatureValid =
        expected.length === received.length &&
        crypto.timingSafeEqual(expected, received);

      if (!isSignatureValid) {
        console.error("[razorpay-webhook] Webhook signature mismatch");
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      console.warn("[razorpay-webhook] Neither RAZORPAY_WEBHOOK_SECRET nor RAZORPAY_KEY_SECRET set; skipping signature check in dev.");
    }

    // 2. Parse Event Payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON payload", { status: 400 });
    }

    const eventType: string = typeof event.event === "string" ? event.event : "";
    const payload = event.payload && typeof event.payload === "object" ? event.payload : {};
    const eventId =
      req.headers.get("x-razorpay-event-id") ||
      event.event_id ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    console.info(`[razorpay-webhook] Event: ${eventType} (ID: ${eventId})`);

    // 3. Idempotency Tracking: Record event ID
    if (hasAdminCredentials) {
      const eventRef = adminDb.collection("webhook_events").doc(eventId);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists && eventDoc.data()?.status === "processed") {
        console.info(`[razorpay-webhook] Event ${eventId} already processed. Skipping duplicate.`);
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

    // Helper to find order by Razorpay order ID or note order ID
    const findOrder = async (rzpOrderId?: string, customOrderId?: string): Promise<{ id: string; ref?: any; data: any } | null> => {
      if (hasAdminCredentials) {
        if (customOrderId) {
          const snap = await adminDb.collection("orders").doc(customOrderId).get();
          if (snap.exists) return { id: snap.id, ref: snap.ref, data: snap.data()! };
        }
        if (rzpOrderId) {
          const snap = await adminDb
            .collection("orders")
            .where("razorpayOrderId", "==", rzpOrderId)
            .limit(1)
            .get();
          if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, ref: doc.ref, data: doc.data() };
          }
        }
      }

      const allOrders = await storeReadCollection<any>("orders");
      const matched = allOrders.find(
        (o) =>
          (customOrderId && (o.id === customOrderId || o.orderNumber === customOrderId)) ||
          (rzpOrderId && o.razorpayOrderId === rzpOrderId)
      );
      return matched ? { id: matched.id, data: matched } : null;
    };

    // 4. Handle Webhook Events
    switch (eventType) {
      case "payment.captured": {
        const payment = payload.payment?.entity || {};
        const rzpOrderId = payment.order_id;
        const customOrderId = payment.notes?.orderId;
        const paymentId = payment.id;

        const order = await findOrder(rzpOrderId, customOrderId);
        if (order) {
          // If already paid, do nothing
          if (order.data?.paymentStatus === "paid" || order.data?.status === "paid") {
            break;
          }

          const update = {
            status: "paid",
            paymentStatus: "paid",
            razorpayPaymentId: paymentId,
            paidAt: now,
            updatedAt: now,
            statusHistory: [
              ...(order.data?.statusHistory || []),
              {
                status: "paid",
                timestamp: now,
                note: `Payment captured by Razorpay webhook (${paymentId})`,
              },
            ],
          };

          if (hasAdminCredentials && order.ref) {
            await order.ref.update(update);
          } else {
            await storeUpdateDocument("orders", order.id, update);
          }
          console.info(`[razorpay-webhook] Order ${order.id} marked as paid via payment.captured`);
        }
        break;
      }

      case "order.paid": {
        const rzpOrder = payload.order?.entity || {};
        const rzpOrderId = rzpOrder.id;
        const customOrderId = rzpOrder.notes?.orderId;

        const order = await findOrder(rzpOrderId, customOrderId);
        if (order) {
          if (order.data?.paymentStatus === "paid" || order.data?.status === "paid") {
            break;
          }

          const update = {
            status: "paid",
            paymentStatus: "paid",
            paidAt: now,
            updatedAt: now,
            statusHistory: [
              ...(order.data?.statusHistory || []),
              {
                status: "paid",
                timestamp: now,
                note: `Order paid confirmed by Razorpay webhook (${rzpOrderId})`,
              },
            ],
          };

          if (hasAdminCredentials && order.ref) {
            await order.ref.update(update);
          } else {
            await storeUpdateDocument("orders", order.id, update);
          }
          console.info(`[razorpay-webhook] Order ${order.id} marked as paid via order.paid`);
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity || {};
        const rzpOrderId = payment.order_id;
        const customOrderId = payment.notes?.orderId;
        const errorCode = payment.error_code || "PAYMENT_FAILED";
        const errorDesc = payment.error_description || "Customer payment failed or was declined";

        const order = await findOrder(rzpOrderId, customOrderId);
        if (order) {
          // Don't overwrite if order was already successfully paid
          if (order.data?.paymentStatus === "paid") {
            break;
          }

          const update = {
            status: "failed",
            paymentStatus: "failed",
            errorCode,
            errorDescription: errorDesc,
            updatedAt: now,
            statusHistory: [
              ...(order.data?.statusHistory || []),
              {
                status: "failed",
                timestamp: now,
                note: `Payment failed (${errorCode}): ${errorDesc}`,
              },
            ],
          };

          if (hasAdminCredentials && order.ref) {
            await order.ref.update(update);
          } else {
            await storeUpdateDocument("orders", order.id, update);
          }
          console.info(`[razorpay-webhook] Order ${order.id} marked as failed via payment.failed`);
        }
        break;
      }

      default:
        console.info(`[razorpay-webhook] Unhandled event type: ${eventType}`);
        break;
    }

    // Mark event processed
    if (hasAdminCredentials) {
      await adminDb
        .collection("webhook_events")
        .doc(eventId)
        .set({ status: "processed", processedAt: now }, { merge: true });
    }

    console.info(`[razorpay-webhook] Processed in ${Date.now() - reqStart}ms`);
    return NextResponse.json({ success: true, event: eventType });
  } catch (err: any) {
    console.error("[razorpay-webhook] Webhook handling error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

