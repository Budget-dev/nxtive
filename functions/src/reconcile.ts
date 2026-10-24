import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { razorpayKeyIdSecret, razorpayKeySecret } from "./config";
import { getRazorpay } from "./razorpay";

export const reconcileStuckOrders = onSchedule(
  {
    schedule: "every 15 minutes",
    secrets: [razorpayKeyIdSecret, razorpayKeySecret],
  },
  async (event) => {
    const db = getFirestore();
    const now = Date.now();
    const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    console.info("[reconcileStuckOrders] Starting order reconciliation scan...");

    // Query orders stuck in created or pending states
    const stuckOrdersSnap = await db
      .collection("orders")
      .where("status", "in", ["created", "pending"])
      .get();

    if (stuckOrdersSnap.empty) {
      console.info("[reconcileStuckOrders] No stuck orders found.");
      return;
    }

    let razorpay: any;
    try {
      razorpay = getRazorpay();
    } catch (e) {
      console.error("[reconcileStuckOrders] Razorpay client init error:", e);
      return;
    }

    let reconciledSuccess = 0;
    let reconciledFailed = 0;
    let skipped = 0;

    for (const doc of stuckOrdersSnap.docs) {
      const order = doc.data();
      const createdAtDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || 0);

      // Only inspect orders created between 15 mins and 24 hours ago
      if (createdAtDate > fifteenMinutesAgo || createdAtDate < twentyFourHoursAgo) {
        skipped++;
        continue;
      }

      if (!order.razorpayOrderId) {
        // Order never got a razorpayOrderId and has been stuck for > 15 mins
        await doc.ref.update({
          status: "failed",
          errorCode: "INITIALIZATION_ABANDONED",
          errorDescription: "Payment checkout was never initialized with gateway.",
          updatedAt: FieldValue.serverTimestamp(),
          statusHistory: FieldValue.arrayUnion({
            status: "failed",
            timestamp: new Date().toISOString(),
            note: "Reconciled as failed: checkout session never initialized",
          }),
        });
        reconciledFailed++;
        continue;
      }

      try {
        // Query Razorpay Payments for this order
        const paymentsResponse: any = await razorpay.orders.fetchPayments(order.razorpayOrderId);
        const payments: any[] = paymentsResponse.items || [];

        // Check if any payment was captured
        const capturedPayment = payments.find((p) => p.status === "captured");

        if (capturedPayment) {
          const nowIso = new Date().toISOString();
          await doc.ref.update({
            status: "success",
            razorpayPaymentId: capturedPayment.id,
            paymentMethod: capturedPayment.method || "online",
            errorCode: null,
            errorDescription: null,
            updatedAt: FieldValue.serverTimestamp(),
            statusHistory: FieldValue.arrayUnion({
              status: "success",
              timestamp: nowIso,
              note: `Reconciled via scheduled job: captured payment ${capturedPayment.id} discovered on Razorpay`,
            }),
          });

          // Sync user stats
          if (order.userId && order.userId !== "guest") {
            const userRef = db.collection("users").doc(order.userId);
            await userRef.set(
              {
                ordersCount: FieldValue.increment(1),
                totalSpent: FieldValue.increment(order.amount || 0),
                lastActivity: nowIso,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          reconciledSuccess++;
          continue;
        }

        // Check if order is expired or older than 60 mins with only failed/no payments
        const sixtyMinutesAgo = new Date(now - 60 * 60 * 1000);
        if (createdAtDate < sixtyMinutesAgo) {
          const lastPayment = payments[0];
          await doc.ref.update({
            status: "failed",
            errorCode: lastPayment?.error_code || "SESSION_EXPIRED",
            errorDescription:
              lastPayment?.error_description || "Payment session expired without completion.",
            errorReason: lastPayment?.error_reason || "timeout",
            updatedAt: FieldValue.serverTimestamp(),
            statusHistory: FieldValue.arrayUnion({
              status: "failed",
              timestamp: new Date().toISOString(),
              note: "Reconciled as failed: payment session expired (> 60 minutes)",
            }),
          });
          reconciledFailed++;
        }
      } catch (err: any) {
        console.warn(`[reconcileStuckOrders] Error checking Razorpay order ${order.razorpayOrderId}:`, err.message);
      }
    }

    console.info(
      `[reconcileStuckOrders] Finished reconciliation. Success: ${reconciledSuccess}, Failed: ${reconciledFailed}, Skipped: ${skipped}`
    );
  }
);
