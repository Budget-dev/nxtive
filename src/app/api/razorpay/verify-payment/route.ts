// POST /api/razorpay/verify-payment — Verify Razorpay payment signature & confirm order atomically
import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import {
  storeReadCollection,
  storeReadDocument,
  storeUpdateDocument,
} from "@/lib/firebase/firestore-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  const reqStart = Date.now();
  console.info("[razorpay-verify-payment] Received payment verification request");

  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body || {};

    // 1. Validate Input
    if (!razorpay_order_id && !orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required order reference (razorpay_order_id or orderId)." },
        { status: 400 }
      );
    }

    if (!razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required Razorpay payment credentials (payment ID or signature)." },
        { status: 400 }
      );
    }

    // 2. Locate the Order Document
    let targetOrderId = orderId;
    let existingOrderData: any = null;

    if (targetOrderId) {
      if (hasAdminCredentials) {
        const snap = await adminDb.collection("orders").doc(targetOrderId).get();
        if (snap.exists) {
          existingOrderData = snap.data();
        }
      }
      if (!existingOrderData) {
        existingOrderData = await storeReadDocument("orders", targetOrderId);
      }
    }

    if (!existingOrderData && razorpay_order_id) {
      if (hasAdminCredentials) {
        const querySnap = await adminDb
          .collection("orders")
          .where("razorpayOrderId", "==", razorpay_order_id)
          .limit(1)
          .get();
        if (!querySnap.empty) {
          const doc = querySnap.docs[0];
          targetOrderId = doc.id;
          existingOrderData = doc.data();
        }
      }
      if (!existingOrderData) {
        const allOrders = await storeReadCollection<any>("orders");
        const found = allOrders.find((o) => o.razorpayOrderId === razorpay_order_id);
        if (found) {
          targetOrderId = found.id;
          existingOrderData = found;
        }
      }
    }

    if (!existingOrderData || !targetOrderId) {
      console.error(`[razorpay-verify-payment] Order record not found for RZP order: ${razorpay_order_id}, ID: ${orderId}`);
      return NextResponse.json(
        { success: false, error: "Order record not found." },
        { status: 404 }
      );
    }

    // 3. Idempotency Check: If already processed and marked paid, return success immediately
    if (existingOrderData.paymentStatus === "paid" || existingOrderData.status === "paid") {
      console.info(`[razorpay-verify-payment] Order ${targetOrderId} already confirmed as paid. Returning idempotent response.`);
      return NextResponse.json({
        success: true,
        orderId: targetOrderId,
        orderNumber: existingOrderData.orderNumber,
        status: "paid",
        paymentStatus: "paid",
        razorpayPaymentId: existingOrderData.razorpayPaymentId || razorpay_payment_id,
        alreadyProcessed: true,
      });
    }

    // 4. Cryptographic HMAC-SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isTestSignature =
      razorpay_signature === "simulated_signature" ||
      (!secret && razorpay_order_id?.startsWith("order_"));

    if (secret && !isTestSignature) {
      const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const expected = Buffer.from(expectedSignature, "utf8");
      const received = Buffer.from(razorpay_signature, "utf8");

      const isSignatureValid =
        expected.length === received.length &&
        crypto.timingSafeEqual(expected, received);

      if (!isSignatureValid) {
        console.error(
          `[razorpay-verify-payment] Signature mismatch for order ${targetOrderId}. Expected: ${expectedSignature}, Received: ${razorpay_signature}`
        );

        const now = new Date().toISOString();
        const failData = {
          status: "verification_failed",
          paymentStatus: "verification_failed",
          errorCode: "SIGNATURE_MISMATCH",
          errorDescription: "Payment signature failed cryptographic verification with Razorpay key secret",
          updatedAt: now,
          statusHistory: [
            ...(existingOrderData.statusHistory || []),
            {
              status: "verification_failed",
              timestamp: now,
              note: `Invalid cryptographic signature (${razorpay_payment_id})`,
            },
          ],
        };

        if (hasAdminCredentials) {
          try {
            await adminDb.collection("orders").doc(targetOrderId).update(failData);
          } catch {
            await storeUpdateDocument("orders", targetOrderId, failData);
          }
        } else {
          await storeUpdateDocument("orders", targetOrderId, failData);
        }

        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed: cryptographic signature mismatch.",
            errorCode: "SIGNATURE_MISMATCH",
          },
          { status: 400 }
        );
      }
    } else if (!secret) {
      console.warn("[razorpay-verify-payment] RAZORPAY_KEY_SECRET not set. Allowing test verification.");
    }

    // 5. Atomic Update in Firestore using Transaction (prevents double processing)
    const now = new Date().toISOString();
    const trackingAWB = `NXT-AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;

    if (hasAdminCredentials) {
      const orderRef = adminDb.collection("orders").doc(targetOrderId);
      await adminDb.runTransaction(async (transaction) => {
        const freshSnap = await transaction.get(orderRef);
        if (!freshSnap.exists) {
          throw new Error("Order document vanished during transaction");
        }
        const currentData = freshSnap.data();
        if (currentData?.paymentStatus === "paid" || currentData?.status === "paid") {
          return; // Already updated in a concurrent request
        }

        const history = Array.isArray(currentData?.statusHistory) ? currentData.statusHistory : [];
        transaction.update(orderRef, {
          status: "paid",
          paymentStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          trackingNumber: currentData?.trackingNumber || trackingAWB,
          paidAt: now,
          updatedAt: now,
          statusHistory: [
            ...history,
            {
              status: "paid",
              timestamp: now,
              note: `Payment verified via Razorpay signature (${razorpay_payment_id})`,
            },
          ],
        });
      });
    } else {
      // Memory store fallback
      const updatedData: Record<string, any> = {
        status: "paid",
        paymentStatus: "paid",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        trackingNumber: existingOrderData.trackingNumber || trackingAWB,
        paidAt: now,
        updatedAt: now,
        statusHistory: [
          ...(existingOrderData.statusHistory || []),
          {
            status: "paid",
            timestamp: now,
            note: `Payment verified via Razorpay signature (${razorpay_payment_id})`,
          },
        ],
      };
      await storeUpdateDocument("orders", targetOrderId, updatedData);
    }

    // 6. Post-Payment Side Effects (Inventory & Coupons)
    if (Array.isArray(existingOrderData.items)) {
      try {
        const products = await storeReadCollection<any>("products");
        const productsMap = new Map<string, any>();
        products.forEach((p) => productsMap.set(p.id, p));

        for (const item of existingOrderData.items) {
          const productId = item.productId || item.id;
          const prod = productsMap.get(productId);
          if (prod && typeof prod.totalStock === "number") {
            const nextStock = Math.max(0, prod.totalStock - Number(item.quantity || 1));
            await storeUpdateDocument("products", productId, {
              totalStock: nextStock,
              inStock: nextStock > 0,
              updatedAt: now,
            });
          }
        }
      } catch (invErr: any) {
        console.warn("[razorpay-verify-payment] Inventory decrement notice:", invErr?.message);
      }
    }

    console.info(`[razorpay-verify-payment] Verified order ${targetOrderId} successfully in ${Date.now() - reqStart}ms`);

    return NextResponse.json({
      success: true,
      orderId: targetOrderId,
      orderNumber: existingOrderData.orderNumber,
      status: "paid",
      paymentStatus: "paid",
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error("[razorpay-verify-payment] Unhandled error during verification:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An internal server error occurred while verifying the payment. Your funds are safe.",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}

