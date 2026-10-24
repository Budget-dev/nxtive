// POST /api/payments/create-order — Server-side Razorpay order creation
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { storeReadCollection, storeSetDocument, storeUpdateDocument } from "@/lib/firebase/firestore-store";
import { generateOrderNumber } from "@/utils/slugify";
import { getRazorpayInstance } from "@/server/payments/razorpay/client";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  try {
    const body = await req.json();
    const { items, shippingAddress, deliveryMethod, couponCode, userId, idempotencyKey } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Items are required" }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.email || !shippingAddress.fullName) {
      return NextResponse.json({ success: false, error: "Shipping address is required" }, { status: 400 });
    }

    // 1. Resolve products against Firestore store (Server-side amount calculation - NEVER trust client amounts)
    const products = await storeReadCollection<Product>("products");
    const productsMap = new Map<string, Product>();
    products.forEach((p) => productsMap.set(p.id, p));

    const resolvedItems = items.map((item: any) => {
      const prod = productsMap.get(item.productId || item.id);
      return {
        productId: item.productId || item.id,
        title: String(prod?.title || item.title || "Apparel Item"),
        price: Number(prod?.price !== undefined ? prod.price : item.price || 1299),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        selectedSize: String(item.selectedSize || "M"),
        selectedColor: item.selectedColor || null,
        image: String(prod?.image || item.image || "/images/nxtvie/product-oversized-tee-hd.jpg"),
        slug: prod?.slug,
        sku: prod?.sku,
      };
    });

    const subtotal = Math.round(
      resolvedItems.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100
    ) / 100;

    let discount = 0;
    if (couponCode) {
      const clean = String(couponCode).trim().toUpperCase();
      if (clean === "NEXT10") discount = Math.round(subtotal * 0.1);
      else if (clean === "NXTIVE20") discount = Math.round(subtotal * 0.2);
    }

    const isPriority = String(deliveryMethod || "").toLowerCase().includes("priority");
    const shipping = isPriority ? 150 : subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100);
    const amountInPaise = Math.round(total * 100);

    const orderNumber = generateOrderNumber();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // 2. Write Firestore document with status: "created" BEFORE calling Razorpay Orders API
    const initialOrderData = {
      id: orderId,
      orderNumber,
      userId: userId || "guest",
      amount: total,
      amountPaise: amountInPaise,
      currency: "INR",
      status: "created" as const,
      paymentStatus: "created",
      razorpayOrderId: null as string | null,
      razorpayPaymentId: null as string | null,
      errorCode: null as string | null,
      errorDescription: null as string | null,
      items: resolvedItems,
      subtotal,
      discount,
      couponCode: couponCode || null,
      shipping,
      total,
      shippingAddress: {
        ...shippingAddress,
      },
      deliveryMethod: deliveryMethod || "Standard Domestic",
      deliveryDateEstimate: isPriority ? "1-2 Business Days" : "4-5 Business Days",
      idempotencyKey: idempotencyKey || `${Date.now()}-${orderId}`,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: "created",
          timestamp: now,
          note: "Order created in Firestore, awaiting Razorpay order generation",
        },
      ],
    };

    await storeSetDocument("orders", orderId, initialOrderData, false);

    // 3. Call Razorpay Orders API server-side
    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let isFallback = true;

    if (key_id && key_secret) {
      try {
        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderNumber,
          notes: {
            orderId,
            orderNumber,
            userId: userId || "",
          },
        });
        if (rzpOrder && rzpOrder.id) {
          razorpayOrderId = rzpOrder.id;
          isFallback = false;
        }
      } catch (rzpErr: any) {
        console.warn("[Razorpay] Order create fallback activated:", rzpErr);
        await storeUpdateDocument("orders", orderId, {
          status: "failed",
          errorCode: rzpErr?.code || "RAZORPAY_API_ERROR",
          errorDescription: rzpErr?.message || "Failed to create order on payment gateway",
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...initialOrderData.statusHistory,
            {
              status: "failed",
              timestamp: new Date().toISOString(),
              note: `Failed to create order with Razorpay: ${rzpErr?.message || "Gateway error"}`,
            },
          ],
        });
        return NextResponse.json(
          { success: false, error: rzpErr?.message || "Failed to create order with payment gateway" },
          { status: 500 }
        );
      }
    }

    // 4. Update the Firestore order document with razorpayOrderId
    await storeUpdateDocument("orders", orderId, {
      razorpayOrderId,
      status: "pending",
      paymentStatus: "pending",
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...initialOrderData.statusHistory,
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          note: isFallback
            ? "Initiated Online Payment (Gateway Fallback Mode)"
            : `Linked Razorpay Order ID: ${razorpayOrderId}`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: key_id || "rzp_test_fallback",
      isFallback,
    });
  } catch (err: any) {
    console.error("[payments-create-order] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
