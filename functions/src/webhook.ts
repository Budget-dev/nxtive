import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { razorpayWebhookSecret, razorpayKeyIdSecret, razorpayKeySecret } from "./config";
import { verifyWebhookSignature } from "./razorpay";

export const razorpayWebhook = onRequest(
  {
    secrets: [razorpayWebhookSecret, razorpayKeyIdSecret, razorpayKeySecret],
    cors: false,
  },
  async (req, res) => {
    // 1. Enforce POST
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string;
    if (!signature) {
      console.error("[razorpayWebhook] Missing x-razorpay-signature header");
      res.status(400).send("Missing webhook signature header");
      return;
    }

    // 2. Cryptographic signature verification using raw request body
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error("[razorpayWebhook] Invalid cryptographic signature rejected.");
      res.status(400).send("Invalid webhook signature");
      return;
    }

    const db = getFirestore();
    const event = typeof req.body === "object" ? req.body : JSON.parse(rawBody.toString("utf8"));
    const eventType: string = event.event || "";
    const eventId: string =
      (req.headers["x-razorpay-event-id"] as string) ||
      event.event_id ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = event.payload || {};
    const nowIso = new Date().toISOString();

    console.info(`[razorpayWebhook] Received event: ${eventType} (ID: ${eventId})`);

    // 3. IDEMPOTENCY & DUPLICATE PREVENTION CHECK
    const eventRef = db.collection("webhook_events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists && eventSnap.data()?.status === "processed") {
      console.info(`[razorpayWebhook] Duplicate webhook event ${eventId} already processed. Acknowledging with 200 OK.`);
      res.status(200).json({ status: "already_processed" });
      return;
    }

    // Record incoming event
    await eventRef.set({
      eventId,
      eventType,
      receivedAt: FieldValue.serverTimestamp(),
      status: "processing",
    });

    try {
      switch (eventType) {
        case "payment.captured": {
          const payment = payload.payment?.entity;
          if (!payment) break;

          const razorpayOrderId = payment.order_id;
          const razorpayPaymentId = payment.id;
          const paymentMethod = payment.method || "online";

          // Find order either from notes or by razorpayOrderId lookup
          const orderDocRef = await resolveOrderDocRef(db, razorpayOrderId, payment.notes?.orderId);

          if (!orderDocRef) {
            console.warn(`[razorpayWebhook] No Firestore order matching Razorpay order ID ${razorpayOrderId}`);
            break;
          }

          // Atomic Firestore transaction with state guard
          await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(orderDocRef);
            if (!doc.exists) return;

            const order = doc.data()!;

            // State guard: if already marked success or refunded, preserve state
            if (order.status === "success") {
              console.info(`[razorpayWebhook] Order ${orderDocRef.id} is already in 'success' state. Webhook idempotent pass.`);
              return;
            }
            if (order.status === "refunded") {
              console.warn(`[razorpayWebhook] Order ${orderDocRef.id} is refunded. Ignoring late capture.`);
              return;
            }

            transaction.update(orderDocRef, {
              status: "success",
              razorpayOrderId: razorpayOrderId,
              razorpayPaymentId: razorpayPaymentId,
              paymentMethod,
              errorCode: null,
              errorDescription: null,
              updatedAt: FieldValue.serverTimestamp(),
              statusHistory: FieldValue.arrayUnion({
                status: "success",
                timestamp: nowIso,
                note: `Payment captured via Razorpay Webhook (${razorpayPaymentId})`,
              }),
            });

            // Update user stats
            if (order.userId && order.userId !== "guest") {
              const userRef = db.collection("users").doc(order.userId);
              transaction.set(
                userRef,
                {
                  ordersCount: FieldValue.increment(1),
                  totalSpent: FieldValue.increment(order.amount || 0),
                  lastActivity: nowIso,
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            }
          });
          break;
        }

        case "payment.failed": {
          const payment = payload.payment?.entity;
          if (!payment) break;

          const razorpayOrderId = payment.order_id;
          const errorCode = payment.error_code || "PAYMENT_FAILED";
          const errorDescription = payment.error_description || "Payment failed at gateway or bank";
          const errorReason = payment.error_reason || "unknown";

          const orderDocRef = await resolveOrderDocRef(db, razorpayOrderId, payment.notes?.orderId);
          if (!orderDocRef) break;

          await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(orderDocRef);
            if (!doc.exists) return;

            const order = doc.data()!;

            // CRITICAL REQUIREMENT: Late failed webhook CANNOT overwrite an already-verified success
            if (order.status === "success") {
              console.warn(
                `[razorpayWebhook CONFLICT] Late payment.failed received for order ${orderDocRef.id} which is ALREADY in 'success' state. Ignoring failure.`
              );
              return;
            }

            if (order.status === "refunded") {
              return;
            }

            transaction.update(orderDocRef, {
              status: "failed",
              errorCode,
              errorDescription,
              errorReason,
              updatedAt: FieldValue.serverTimestamp(),
              statusHistory: FieldValue.arrayUnion({
                status: "failed",
                timestamp: nowIso,
                note: `Payment failed (${errorCode}: ${errorDescription})`,
              }),
            });
          });
          break;
        }

        case "order.paid": {
          const orderEntity = payload.order?.entity;
          if (!orderEntity) break;

          const razorpayOrderId = orderEntity.id;
          const orderDocRef = await resolveOrderDocRef(db, razorpayOrderId, orderEntity.notes?.orderId);
          if (!orderDocRef) break;

          await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(orderDocRef);
            if (!doc.exists) return;

            const order = doc.data()!;
            if (order.status !== "success" && order.status !== "refunded") {
              transaction.update(orderDocRef, {
                status: "success",
                updatedAt: FieldValue.serverTimestamp(),
                statusHistory: FieldValue.arrayUnion({
                  status: "success",
                  timestamp: nowIso,
                  note: `Order reconciled to paid via order.paid webhook`,
                }),
              });
            }
          });
          break;
        }

        case "refund.created":
        case "refund.processed": {
          const refund = payload.refund?.entity;
          if (!refund) break;

          const paymentId = refund.payment_id;
          const refundPaise = Number(refund.amount || 0);
          const refundId = refund.id;

          // Find order by razorpayPaymentId
          const orderSnap = await db
            .collection("orders")
            .where("razorpayPaymentId", "==", paymentId)
            .limit(1)
            .get();

          if (!orderSnap.empty) {
            const orderDoc = orderSnap.docs[0];
            await orderDoc.ref.update({
              status: "refunded",
              refundId,
              refundAmount: refundPaise / 100,
              updatedAt: FieldValue.serverTimestamp(),
              statusHistory: FieldValue.arrayUnion({
                status: "refunded",
                timestamp: nowIso,
                note: `Refund processed: ${refundId} (INR ${refundPaise / 100})`,
              }),
            });
          }
          break;
        }

        case "payment.authorized": {
          const payment = payload.payment?.entity;
          if (payment) {
            console.info(`[razorpayWebhook] Payment authorized: ${payment.id} for order ${payment.order_id}`);
          }
          break;
        }

        default:
          console.info(`[razorpayWebhook] Unhandled event type acknowledged: ${eventType}`);
      }

      // Mark webhook event processed
      await eventRef.update({
        status: "processed",
        processedAt: FieldValue.serverTimestamp(),
      });

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("[razorpayWebhook] Processing error:", err);
      await eventRef.update({
        status: "error",
        error: err?.message || "Internal processing error",
        failedAt: FieldValue.serverTimestamp(),
      });
      // 500 triggers Razorpay webhook retry schedule
      res.status(500).send("Webhook internal error");
    }
  }
);

/**
 * Helper to resolve the Firestore order document reference by direct ID, notes,
 * or by querying `razorpayOrderId`.
 */
async function resolveOrderDocRef(
  db: FirebaseFirestore.Firestore,
  razorpayOrderId?: string,
  directOrderId?: string
): Promise<FirebaseFirestore.DocumentReference | null> {
  if (directOrderId) {
    const directRef = db.collection("orders").doc(directOrderId);
    const snap = await directRef.get();
    if (snap.exists) return directRef;
  }

  if (razorpayOrderId) {
    const snap = await db
      .collection("orders")
      .where("razorpayOrderId", "==", razorpayOrderId)
      .limit(1)
      .get();

    if (!snap.empty) {
      return snap.docs[0].ref;
    }
  }

  return null;
}
