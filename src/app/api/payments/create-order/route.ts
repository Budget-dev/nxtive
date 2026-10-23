// POST /api/payments/create-order — Creates Razorpay order with resilient fallback
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { storeReadCollection, storeSetDocument } from "@/lib/firebase/firestore-store";
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

    // Resolve products against store
    const products = await storeReadCollection<Product>("products");
    const productsMap = new Map<string, Product>();
    products.forEach((p) => productsMap.set(p.id, p));

    const resolvedItems = items.map((item: any) => {
      const prod = productsMap.get(item.productId || item.id);
      return {
        productId: item.productId || item.id,
        title: String(prod?.title || item.title || "Apparel Item"),
        price: Number(prod?.price || item.price || 1299),
        quantity: Number(item.quantity || 1),
        selectedSize: String(item.selectedSize || "M"),
        selectedColor: item.selectedColor,
        image: String(prod?.image || item.image || "/images/nxtvie/product-oversized-tee-hd.jpg"),
        slug: prod?.slug,
        sku: prod?.sku,
      };
    });

    const subtotal = Math.round(
      resolvedItems.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100
    ) / 100;
    const isPriority = String(deliveryMethod || "").toLowerCase().includes("priority");
    const shipping = isPriority ? 150 : subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, Math.round((subtotal + shipping) * 100) / 100);
    const amountInPaise = Math.round(total * 100);

    const orderNumber = generateOrderNumber();
    const orderId = "ord-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

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
      } catch (rzpErr) {
        console.warn("[Razorpay] Order create fallback activated:", rzpErr);
        isFallback = true;
      }
    }

    const orderData = {
      id: orderId,
      orderNumber,
      userId: userId || "guest",
      items: resolvedItems,
      subtotal,
      discount: 0,
      couponCode: couponCode || null,
      shipping,
      total,
      totalAmount: total,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: now,
          note: isFallback
            ? "Initiated Online Payment (Gateway Fallback Mode)"
            : "Initiated Razorpay payment order",
        },
      ],
      paymentMethod: "Razorpay (Online)",
      paymentStatus: "pending",
      razorpayOrderId,
      shippingAddress: {
        ...shippingAddress,
      },
      deliveryMethod: deliveryMethod || "Standard Domestic",
      deliveryDateEstimate: isPriority ? "1-2 Business Days" : "4-5 Business Days",
      idempotencyKey: idempotencyKey || `${Date.now()}-${orderId}`,
      createdAt: now,
      updatedAt: now,
    };

    await storeSetDocument("orders", orderId, orderData, false);

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
