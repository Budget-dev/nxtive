import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { razorpayKeyIdSecret, razorpayKeySecret } from "./config";
import { getRazorpay, verifyPaymentSignature } from "./razorpay";

interface VerifyPaymentRequest {
  orderId?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const verifyRazorpayPayment = onCall(
  {
    secrets: [razorpayKeyIdSecret, razorpayKeySecret],
    cors: true,
  },
  async (request) => {
    // 1. Authentication check
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication is required to verify payment."
      );
    }

    const userId = request.auth.uid;
    const db = getFirestore();
    const data = (request.data || {}) as VerifyPaymentRequest;

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required payment verification parameters (order ID, payment ID, signature)."
      );
    }

    // 2. Locate Firestore order document
    let orderRef: FirebaseFirestore.DocumentReference;
    if (orderId) {
      orderRef = db.collection("orders").doc(orderId);
    } else {
      const snap = await db
        .collection("orders")
        .where("razorpayOrderId", "==", razorpay_order_id)
        .limit(1)
        .get();

      if (snap.empty) {
        throw new HttpsError("not-found", "Associated order record not found.");
      }
      orderRef = snap.docs[0].ref;
    }

    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Order record does not exist.");
    }

    const orderData = orderSnap.data()!;

    // Ensure the caller is either the order owner or admin
    if (orderData.userId !== userId && !request.auth.token.admin) {
      throw new HttpsError(
        "permission-denied",
        "You are not authorized to verify this order."
      );
    }

    // 3. CRYPTOGRAPHIC SIGNATURE VERIFICATION
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    const nowIso = new Date().toISOString();

    if (!isValid) {
      console.error(
        `[verifyRazorpayPayment] Signature verification failed for order ${orderRef.id}, razorpay_order_id: ${razorpay_order_id}`
      );

      // Explicitly mark verification_failed in Firestore — NEVER mark as success
      await orderRef.update({
        status: "verification_failed",
        errorCode: "SIGNATURE_VERIFICATION_FAILED",
        errorDescription: "Client payment signature mismatch against server secret",
        updatedAt: FieldValue.serverTimestamp(),
        statusHistory: FieldValue.arrayUnion({
          status: "verification_failed",
          timestamp: nowIso,
          note: `Signature verification failed for payment ${razorpay_payment_id}`,
        }),
      });

      throw new HttpsError(
        "invalid-argument",
        "Payment verification failed: Invalid cryptographic signature."
      );
    }

    // 4. IDEMPOTENT ORDER SUCCESS UPDATE
    // If the order has already been marked success (e.g. by webhook), return immediately
    if (orderData.status === "success") {
      return {
        success: true,
        orderId: orderRef.id,
        status: "success",
        alreadyProcessed: true,
      };
    }

    // Don't allow verification if order was already cancelled or refunded
    if (orderData.status === "refunded") {
      throw new HttpsError(
        "failed-precondition",
        "This order has already been refunded."
      );
    }

    // Fetch payment method details from Razorpay API
    let paymentMethod = "online";
    try {
      const razorpay = getRazorpay();
      const paymentInfo: any = await razorpay.payments.fetch(razorpay_payment_id);
      if (paymentInfo && paymentInfo.method) {
        paymentMethod = paymentInfo.method;
      }
    } catch (fetchErr) {
      console.warn("[verifyRazorpayPayment] Could not fetch payment method details:", fetchErr);
    }

    // Perform atomic update
    await orderRef.update({
      status: "success",
      razorpayPaymentId: razorpay_payment_id,
      paymentMethod,
      errorCode: null,
      errorDescription: null,
      updatedAt: FieldValue.serverTimestamp(),
      statusHistory: FieldValue.arrayUnion({
        status: "success",
        timestamp: nowIso,
        note: `Payment verified successfully via client callback (${razorpay_payment_id})`,
      }),
    });

    // Increment user statistics if registered
    if (userId && userId !== "guest") {
      try {
        const userRef = db.collection("users").doc(userId);
        await userRef.set(
          {
            ordersCount: FieldValue.increment(1),
            totalSpent: FieldValue.increment(orderData.amount || 0),
            lastActivity: nowIso,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (userErr) {
        console.warn("[verifyRazorpayPayment] User stats update warning:", userErr);
      }
    }

    return {
      success: true,
      orderId: orderRef.id,
      status: "success",
      razorpayPaymentId: razorpay_payment_id,
    };
  }
);
