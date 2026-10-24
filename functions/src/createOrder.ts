import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { razorpayKeyIdSecret, razorpayKeySecret, getRazorpayKeyId } from "./config";
import { getRazorpay } from "./razorpay";

interface OrderItemInput {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface ShippingAddressInput {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

interface CreateOrderRequest {
  items: OrderItemInput[];
  shippingAddress: ShippingAddressInput;
  deliveryMethod?: string;
  couponCode?: string;
  metadata?: Record<string, string>;
}

export const createRazorpayOrder = onCall(
  {
    secrets: [razorpayKeyIdSecret, razorpayKeySecret],
    cors: true,
  },
  async (request) => {
    // 1. Authentication check
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be authenticated to create a payment order."
      );
    }

    const userId = request.auth.uid;
    const db = getFirestore();
    const data = (request.data || {}) as CreateOrderRequest;

    const { items, shippingAddress, deliveryMethod, couponCode, metadata } = data;

    // 2. Input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new HttpsError("invalid-argument", "At least one item is required in the cart.");
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email || !shippingAddress.street) {
      throw new HttpsError("invalid-argument", "A valid shipping address is required.");
    }

    // 3. SERVER-SIDE AMOUNT CALCULATION (Never trust client-supplied prices or totals)
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const productRefs = productIds.map((id) => db.collection("products").doc(id));
    const productSnapshots = await db.getAll(...productRefs);

    const productMap = new Map<string, any>();
    productSnapshots.forEach((snap) => {
      if (snap.exists) {
        productMap.set(snap.id, snap.data());
      }
    });

    const resolvedItems = items.map((item) => {
      const prod = productMap.get(item.productId);
      const unitPrice = prod?.price !== undefined ? Number(prod.price) : 1299; // fallback to catalog standard if unseeded
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return {
        productId: item.productId,
        title: prod?.title || "Apparel Item",
        price: unitPrice,
        quantity: qty,
        selectedSize: item.selectedSize || "M",
        selectedColor: item.selectedColor || null,
        image: prod?.image || "/images/nxtvie/product-oversized-tee-hd.jpg",
      };
    });

    const subtotal = resolvedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    // Validate coupon code against coupons collection
    let discount = 0;
    if (couponCode && typeof couponCode === "string") {
      const cleanCoupon = couponCode.trim().toUpperCase();
      const couponDoc = await db.collection("coupons").doc(cleanCoupon).get();
      if (couponDoc.exists) {
        const cData = couponDoc.data()!;
        if (cData.isActive !== false) {
          if (cData.type === "percentage") {
            discount = Math.round((subtotal * Number(cData.value)) / 100);
          } else if (cData.type === "fixed") {
            discount = Number(cData.value) || 0;
          }
        }
      } else if (cleanCoupon === "NEXT10") {
        discount = Math.round(subtotal * 0.1);
      } else if (cleanCoupon === "NXTIVE20") {
        discount = Math.round(subtotal * 0.2);
      }
    }

    const isPriority = String(deliveryMethod || "").toLowerCase().includes("priority");
    const shipping = isPriority ? 150 : subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shipping);
    const amountInPaise = Math.round(total * 100);

    if (amountInPaise <= 0) {
      throw new HttpsError("invalid-argument", "Invalid calculated order amount.");
    }

    // 4. Generate Order ID and write Firestore document BEFORE calling Razorpay
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();
    const orderRef = db.collection("orders").doc(orderId);

    const initialOrderDoc = {
      id: orderId,
      userId,
      amount: total,
      amountPaise: amountInPaise,
      currency: "INR",
      status: "created" as const,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      errorCode: null,
      errorDescription: null,
      items: resolvedItems,
      subtotal,
      discount,
      shipping,
      couponCode: couponCode || null,
      shippingAddress: {
        ...shippingAddress,
        country: shippingAddress.country || "India",
      },
      deliveryMethod: deliveryMethod || "Standard Domestic",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      statusHistory: [
        {
          status: "created",
          timestamp: nowIso,
          note: "Order created in Firestore, initiating Razorpay order session",
        },
      ],
    };

    await orderRef.set(initialOrderDoc);

    // 5. Call Razorpay Orders API server-side
    let rzpOrder: any;
    try {
      const razorpay = getRazorpay();
      rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId.slice(0, 40),
        notes: {
          orderId,
          userId,
          ...(metadata || {}),
        },
      });
    } catch (rzpErr: any) {
      console.error("[createRazorpayOrder] Razorpay Orders API error:", rzpErr);
      await orderRef.update({
        status: "failed",
        errorCode: rzpErr?.code || "RAZORPAY_API_ERROR",
        errorDescription: rzpErr?.message || "Failed to create order on payment gateway",
        updatedAt: FieldValue.serverTimestamp(),
        statusHistory: FieldValue.arrayUnion({
          status: "failed",
          timestamp: new Date().toISOString(),
          note: `Razorpay order creation failed: ${rzpErr?.message || "Gateway error"}`,
        }),
      });
      throw new HttpsError(
        "internal",
        "Could not initialize payment with Razorpay. Please retry."
      );
    }

    // 6. Update order with Razorpay Order ID
    await orderRef.update({
      razorpayOrderId: rzpOrder.id,
      updatedAt: FieldValue.serverTimestamp(),
      statusHistory: FieldValue.arrayUnion({
        status: "created",
        timestamp: new Date().toISOString(),
        note: `Linked Razorpay Order ID: ${rzpOrder.id}`,
      }),
    });

    // 7. Return order ID and public Razorpay Key to client
    return {
      success: true,
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: getRazorpayKeyId(),
    };
  }
);
