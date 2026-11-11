// POST /api/create-order — Razorpay Standard Web Checkout order creation endpoint
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance } from "@/server/payments/razorpay/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let { amount, currency = "INR", receipt, notes } = body || {};

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: "Missing required 'amount' field." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount. Minimum transaction amount is 100 paise (₹1.00 INR).",
        },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(numericAmount);
    const receiptId = String(receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("[create-order] Missing server credentials: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET");
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway credentials are not configured on the server.",
        },
        { status: 500 }
      );
    }

    try {
      const razorpay = getRazorpayInstance();
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: receiptId,
        notes: typeof notes === "object" && notes !== null ? notes : undefined,
      });

      return NextResponse.json({
        success: true,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt,
        key_id,
      });
    } catch (rzpErr: any) {
      console.error("[create-order] Razorpay API Error:", rzpErr);
      const statusCode = rzpErr?.statusCode === 401 ? 401 : 500;
      return NextResponse.json(
        {
          success: false,
          error: rzpErr?.error?.description || rzpErr?.message || "Failed to create Razorpay order.",
          code: rzpErr?.error?.code || "RAZORPAY_ERROR",
        },
        { status: statusCode }
      );
    }
  } catch (err: any) {
    console.error("[create-order] Server Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

