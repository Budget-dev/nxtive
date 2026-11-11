// POST /api/verify-payment — Razorpay Standard Web Checkout signature verification
import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      order_id,
      razorpay_payment_id,
      payment_id,
      razorpay_signature,
      signature,
    } = body || {};

    const targetOrderId = razorpay_order_id || order_id;
    const targetPaymentId = razorpay_payment_id || payment_id;
    const targetSignature = razorpay_signature || signature;

    if (!targetOrderId || !targetPaymentId || !targetSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: order_id, payment_id, and signature are required.",
        },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("[verify-payment] RAZORPAY_KEY_SECRET environment variable is missing.");
      return NextResponse.json(
        { success: false, error: "Server payment configuration missing." },
        { status: 500 }
      );
    }

    const payload = `${targetOrderId}|${targetPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expected = Buffer.from(expectedSignature, "utf8");
    const received = Buffer.from(targetSignature, "utf8");

    const isValid =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);

    if (!isValid) {
      console.error(
        `[verify-payment] Signature mismatch. Expected: ${expectedSignature}, Received: ${targetSignature}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Signature verification failed: generated HMAC-SHA256 signature does not match.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order_id: targetOrderId,
      payment_id: targetPaymentId,
    });
  } catch (err: any) {
    console.error("[verify-payment] Verification error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal verification error" },
      { status: 500 }
    );
  }
}

