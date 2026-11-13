// POST /api/razorpay/create-order — Server-side Razorpay order creation
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import { storeReadCollection, storeSetDocument, storeUpdateDocument } from "@/lib/firebase/firestore-store";
import { generateOrderNumber } from "@/utils/slugify";
import { getRazorpayInstance } from "@/server/payments/razorpay/client";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  const reqStart = Date.now();
  console.info("[razorpay-create-order] Initiating order creation request");

  try {
    const body = await req.json().catch(() => ({}));
    const {
      amount: rawAmount,
      currency = "INR",
      userId,
      items,
      shippingAddress,
      deliveryMethod,
      couponCode,
      idempotencyKey,
      paymentMethod: rawPaymentMethod,
    } = body || {};

    // 1. Verify User Authentication via Firebase ID Token if provided
    let verifiedUserId = userId || "guest";
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : (body.idToken as string | undefined);

    if (idToken && hasAdminCredentials) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        verifiedUserId = decodedToken.uid;
        console.info(`[razorpay-create-order] Verified Firebase ID token for user: ${verifiedUserId}`);
      } catch (authErr: any) {
        console.error("[razorpay-create-order] Firebase ID token verification failed:", authErr?.message);
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed: invalid or expired session token.",
            details: authErr?.message,
          },
          { status: 401 }
        );
      }
    }

    // 2. Validate Request Body
    if (!verifiedUserId) {
      return NextResponse.json(
        { success: false, error: "A valid user ID is required to create an order." },
        { status: 400 }
      );
    }

    // Calculate or resolve amount
    let finalAmountRupees = 0;
    let resolvedItems: any[] = [];
    let subtotal = 0;
    let discount = 0;
    let shipping = 0;

    if (Array.isArray(items) && items.length > 0) {
      // Server-side amount validation against catalog to prevent client-side tampering
      try {
        const products = await storeReadCollection<Product>("products");
        const productsMap = new Map<string, Product>();
        products.forEach((p) => productsMap.set(p.id, p));

        resolvedItems = items.map((item: any) => {
          const prod = productsMap.get(item.productId || item.id);
          return {
            productId: item.productId || item.id,
            title: String(prod?.title || item.title || "Apparel Item"),
            price: Number(prod?.price !== undefined ? prod.price : item.price || 0),
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
            selectedSize: String(item.selectedSize || "M"),
            selectedColor: item.selectedColor || null,
            image: String(prod?.image || item.image || ""),
            slug: prod?.slug,
            sku: prod?.sku,
          };
        });

        subtotal = Math.round(
          resolvedItems.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100
        ) / 100;

        if (couponCode) {
          const clean = String(couponCode).trim().toUpperCase();
          if (clean === "WELCOME10" || clean === "NEXT10") {
            discount = Math.round(subtotal * 0.1);
          } else if (clean === "NXTIVE20") {
            discount = Math.round(subtotal * 0.2);
          } else if (clean === "NXTIVE100") {
            discount = subtotal >= 1499 ? 100 : 0;
          }
        }

        const isPriority = String(deliveryMethod || "").toLowerCase().includes("priority");
        shipping = isPriority ? 150 : subtotal >= 999 ? 0 : 99;
        finalAmountRupees = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100);
      } catch (err: any) {
        console.warn("[razorpay-create-order] Catalog lookup failed, falling back to parsed amount:", err?.message);
        finalAmountRupees = Number(rawAmount) || 0;
      }
    } else if (rawAmount !== undefined && rawAmount !== null) {
      finalAmountRupees = Number(rawAmount);
    }

    if (isNaN(finalAmountRupees) || finalAmountRupees <= 0) {
      return NextResponse.json(
        { success: false, error: "Order amount must be a positive number." },
        { status: 400 }
      );
    }

    // COD logic: charge only the advance amount for COD orders
    const COD_ADVANCE = Number(process.env.COD_ADVANCE_AMOUNT || 149);
    const paymentMethod = rawPaymentMethod === "COD" ? "COD" : "ONLINE";
    const isCOD = paymentMethod === "COD" && finalAmountRupees > COD_ADVANCE;
    const razorpayAmountRupees = isCOD ? COD_ADVANCE : finalAmountRupees;

    // Convert amount to paise for Razorpay
    const amountInPaise = Math.round(razorpayAmountRupees * 100);
    const orderNumber = generateOrderNumber();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const receipt = `rcpt_${orderNumber.replace(/[^a-zA-Z0-9]/g, "")}`;
    const now = new Date().toISOString();

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // 3. Store Pending Order Document in Firestore (orders/{orderId}) with status "created"
    const orderDocData = {
      id: orderId,
      orderNumber,
      userId: verifiedUserId,
      amount: finalAmountRupees,
      amountPaise: amountInPaise,
      amountTotal: finalAmountRupees,
      amountPaid: 0,
      amountDue: finalAmountRupees,
      currency: currency || "INR",
      status: "created",
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
      paymentMethod,
      razorpayOrderId: null as string | null,
      receipt,
      items: resolvedItems,
      subtotal: subtotal || finalAmountRupees,
      discount,
      couponCode: couponCode || null,
      shipping,
      total: finalAmountRupees,
      shippingAddress: shippingAddress || {},
      deliveryMethod: deliveryMethod || "Standard Domestic",
      idempotencyKey: idempotencyKey || `${Date.now()}-${orderId}`,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: "created",
          timestamp: now,
          note: `Order initialized (${paymentMethod}), pending Razorpay gateway order generation`,
        },
      ],
    };

    if (hasAdminCredentials) {
      try {
        await adminDb.collection("orders").doc(orderId).set(orderDocData);
      } catch (dbErr: any) {
        console.warn("[razorpay-create-order] AdminDb write failed, using store fallback:", dbErr?.message);
        await storeSetDocument("orders", orderId, orderDocData, false);
      }
    } else {
      await storeSetDocument("orders", orderId, orderDocData, false);
    }

    // 4. Create Razorpay Order with amount in paise and receipt ID
    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let isTestFallback = true;

    if (key_id && key_secret) {
      try {
        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: currency || "INR",
          receipt,
          notes: {
            orderId,
            orderNumber,
            userId: verifiedUserId,
            receipt,
          },
        });

        if (rzpOrder && rzpOrder.id) {
          razorpayOrderId = rzpOrder.id;
          isTestFallback = false;
          console.info(`[razorpay-create-order] Razorpay order created successfully: ${razorpayOrderId}`);
        }
      } catch (rzpErr: any) {
        console.error("[razorpay-create-order] Razorpay API order creation failed:", rzpErr);

        // Update Firestore order status to failed
        const failData = {
          status: "failed",
          paymentStatus: "failed",
          errorCode: rzpErr?.code || "RAZORPAY_API_ERROR",
          errorDescription: rzpErr?.message || "Failed to communicate with payment gateway",
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...orderDocData.statusHistory,
            {
              status: "failed",
              timestamp: new Date().toISOString(),
              note: `Payment gateway error: ${rzpErr?.message || "Unknown error"}`,
            },
          ],
        };

        if (hasAdminCredentials) {
          try {
            await adminDb.collection("orders").doc(orderId).update(failData);
          } catch {
            await storeUpdateDocument("orders", orderId, failData);
          }
        } else {
          await storeUpdateDocument("orders", orderId, failData);
        }

        return NextResponse.json(
          {
            success: false,
            error: "Unable to create payment order with Razorpay. Please verify API keys.",
            details: rzpErr?.message,
          },
          { status: 502 }
        );
      }
    } else {
      console.warn("[razorpay-create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing. Operating in test sandbox mode.");
    }

    // 5. Update Firestore order with the razorpayOrderId and status "pending"
    const updateData = {
      razorpayOrderId,
      status: "pending",
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
      amountPaid: 0,
      amountDue: finalAmountRupees,
      amountTotal: finalAmountRupees,
      paymentMethod,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...orderDocData.statusHistory,
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          note: isTestFallback
            ? "Order created with simulated gateway ID (Test Mode)"
            : `Linked Razorpay Order ID: ${razorpayOrderId}${isCOD ? ` | COD advance: ₹${COD_ADVANCE}` : ""}`,
        },
      ],
    };

    if (hasAdminCredentials) {
      try {
        await adminDb.collection("orders").doc(orderId).update(updateData);
      } catch {
        await storeUpdateDocument("orders", orderId, updateData);
      }
    } else {
      await storeUpdateDocument("orders", orderId, updateData);
    }

    console.info(`[razorpay-create-order] Completed in ${Date.now() - reqStart}ms. Order: ${orderId}, RZP: ${razorpayOrderId}`);

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      currency: currency || "INR",
      receipt,
      keyId: key_id || "rzp_test_placeholder",
      isTestMode: isTestFallback || key_id?.startsWith("rzp_test_"),
      paymentMethod,
      isCOD,
      codAdvance: isCOD ? COD_ADVANCE : null,
      amountTotal: finalAmountRupees,
    });
  } catch (err: any) {
    console.error("[razorpay-create-order] Unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while initializing your payment. Please try again.",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}

