// GET /api/orders — List orders (admin: all, customer: own)
// POST /api/orders — Create a COD order with server-side pricing and stock
// reservation.  Online payments have a separate, explicitly disabled API.
import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireUser, tryRequireAdmin } from "@/server/auth";
import { generateOrderNumber } from "@/utils/slugify";
import { z } from "zod";

class OrderRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  phone: z.string().trim().min(10).max(30),
  street: z.string().trim().min(3).max(200),
  apartment: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().regex(/^\d{6}$/),
  country: z.string()
    .trim()
    .min(2)
    .max(80)
    .refine((country) => country.toLowerCase() === "india", "Shipping is available in India only")
    .transform(() => "India")
    .default("India"),
});

// Client-supplied title, price, and image fields are accepted only for
// backwards-compatible request parsing. They are ignored below and replaced
// with catalogue values read by the server.
const codOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(128),
    title: z.string().max(240).optional(),
    price: z.number().finite().positive().optional(),
    quantity: z.number().int().min(1).max(50),
    selectedSize: z.string().trim().min(1).max(32),
    selectedColor: z.string().trim().max(80).optional(),
    image: z.string().max(2048).optional(),
  })).min(1).max(100),
  shippingAddress: addressSchema,
  deliveryMethod: z.string().trim().min(1).max(80),
  couponCode: z.string().trim().max(80).optional(),
  // The API derives userId from the verified token. If an older client sends
  // this field, a mismatch is rejected rather than trusted.
  userId: z.string().trim().min(1).max(256).optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
});

type CartItem = z.infer<typeof codOrderSchema>["items"][number];

type NormalizedOrderItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  image: string;
  slug?: string;
  sku?: string;
};

type VariantMatch = {
  value: Record<string, unknown>;
  index: number;
};

type StockRequest = {
  productId: string;
  product: FirebaseFirestore.DocumentData;
  productRef: FirebaseFirestore.DocumentReference;
  variantQuantities: Map<number, number>;
  totalQuantity: number;
};

function money(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100_000_000) {
    throw new OrderRequestError("Invalid catalogue price", 400);
  }
  return Math.round(parsed * 100) / 100;
}

function matchVariant(product: FirebaseFirestore.DocumentData, item: CartItem): VariantMatch | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return null;

  const index = variants.findIndex((candidate: any) =>
    candidate &&
    candidate.size === item.selectedSize &&
    (!item.selectedColor || candidate.color === item.selectedColor)
  );
  if (index < 0) throw new OrderRequestError("Selected product variant is unavailable", 400);

  return {
    value: variants[index] as Record<string, unknown>,
    index,
  };
}

function validateProductSelection(
  product: FirebaseFirestore.DocumentData,
  item: CartItem
): VariantMatch | null {
  if (
    product.isActive === false ||
    product.inStock === false ||
    (typeof product.totalStock === "number" && product.totalStock <= 0)
  ) {
    throw new OrderRequestError("One or more selected products are unavailable", 400);
  }

  if (
    Array.isArray(product.sizes) &&
    product.sizes.length > 0 &&
    !product.sizes.includes(item.selectedSize)
  ) {
    throw new OrderRequestError("Selected product size is unavailable", 400);
  }

  if (
    item.selectedColor &&
    Array.isArray(product.colors) &&
    product.colors.length > 0 &&
    !product.colors.some((color: any) => color?.name === item.selectedColor)
  ) {
    throw new OrderRequestError("Selected product color is unavailable", 400);
  }

  return matchVariant(product, item);
}

function calculateCouponDiscount(
  coupon: FirebaseFirestore.DocumentData,
  subtotal: number,
  now: string
): number {
  if (coupon.isActive !== true) return 0;
  if (typeof coupon.validFrom === "string" && coupon.validFrom > now) return 0;
  if (typeof coupon.validUntil === "string" && coupon.validUntil < now) return 0;
  if (typeof coupon.minOrderValue === "number" && subtotal < coupon.minOrderValue) return 0;

  const value = Number(coupon.value);
  if (!Number.isFinite(value) || value < 0) return 0;

  if (coupon.type === "percentage") {
    if (value > 100) return 0;
    const percentageDiscount = Math.round(subtotal * (value / 100) * 100) / 100;
    const maxDiscount = coupon.maxDiscount == null ? percentageDiscount : money(coupon.maxDiscount);
    return Math.min(percentageDiscount, maxDiscount, subtotal);
  }

  return Math.min(money(value), subtotal);
}

function idempotencyDocumentId(userId: string, idempotencyKey: string): string {
  return crypto
    .createHash("sha256")
    .update(`${userId}\u0000${idempotencyKey}`, "utf8")
    .digest("hex");
}

function activeUser(data: FirebaseFirestore.DocumentData | undefined): boolean {
  return Boolean(
    data &&
    data.isActive === true &&
    data.accountStatus !== "suspended" &&
    data.accountStatus !== "pending"
  );
}

function addStockRequest(
  requests: Map<string, StockRequest>,
  productId: string,
  product: FirebaseFirestore.DocumentData,
  productRef: FirebaseFirestore.DocumentReference,
  variantIndex: number | undefined,
  quantity: number
) {
  // Aggregate every line for a product before validating/decrementing stock.
  // This catches duplicate cart lines and ensures one transaction write per
  // product document.
  const key = productId;
  const existing = requests.get(key);
  if (existing) {
    existing.totalQuantity += quantity;
    if (variantIndex != null) {
      existing.variantQuantities.set(
        variantIndex,
        (existing.variantQuantities.get(variantIndex) || 0) + quantity
      );
    }
    return;
  }

  requests.set(key, {
    productId,
    product,
    productRef,
    variantQuantities: variantIndex == null ? new Map() : new Map([[variantIndex, quantity]]),
    totalQuantity: quantity,
  });
}

function decrementStock(
  transaction: FirebaseFirestore.Transaction,
  request: StockRequest,
  now: string
) {
  const product = request.product;
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (variants.length > 0) {
    const nextVariants = variants.map((variant: any, index: number) => {
      const quantity = request.variantQuantities.get(index) || 0;
      if (quantity === 0) return variant;

      const stock = Number(variant?.stock);
      if (!Number.isInteger(stock) || stock < quantity) {
        throw new OrderRequestError("Requested quantity is unavailable", 409);
      }
      return { ...variant, stock: stock - quantity };
    });

    const update: Record<string, unknown> = {
      variants: nextVariants,
      updatedAt: now,
    };
    const totalStock = Number(product.totalStock);
    if (Number.isFinite(totalStock)) {
      if (!Number.isInteger(totalStock) || totalStock < request.totalQuantity) {
        throw new OrderRequestError("Requested quantity is unavailable", 409);
      }
      update.totalStock = totalStock - request.totalQuantity;
      update.inStock = totalStock - request.totalQuantity > 0;
    } else {
      update.inStock = nextVariants.some((variant: any) => Number(variant?.stock) > 0);
    }
    transaction.update(request.productRef, update);
    return;
  }

  const totalStock = Number(product.totalStock);
  if (!Number.isInteger(totalStock) || totalStock < request.totalQuantity) {
    throw new OrderRequestError("Requested quantity is unavailable", 409);
  }
  transaction.update(request.productRef, {
    totalStock: totalStock - request.totalQuantity,
    inStock: totalStock - request.totalQuantity > 0,
    updatedAt: now,
  });
}

export async function GET(req: NextRequest) {
  try {
    const admin = await tryRequireAdmin("orders.view", req);
    const user = admin || await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const requestedPageSize = Number.parseInt(url.searchParams.get("pageSize") || "25", 10);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(requestedPageSize) ||
      requestedPageSize < 1
    ) {
      return NextResponse.json({ success: false, error: "Invalid pagination" }, { status: 400 });
    }
    const pageSize = Math.min(requestedPageSize, 100);
    const status = url.searchParams.get("status");

    let query = adminDb.collection("orders").orderBy("createdAt", "desc");
    if (!admin) {
      query = query.where("userId", "==", user.uid) as typeof query;
    }
    if (status && status !== "all") {
      query = query.where("status", "==", status) as typeof query;
    }

    const snapshot = await query.limit(pageSize).offset((page - 1) * pageSize).get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      success: true,
      data: {
        items: orders,
        page,
        pageSize,
        hasMore: orders.length === pageSize,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[orders-list] Error:", error);
    return NextResponse.json({ success: false, error: "Unable to load orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = codOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.userId && data.userId !== user.uid) {
      return NextResponse.json({ success: false, error: "Invalid order identity" }, { status: 403 });
    }

    const productIds = [...new Set(data.items.map((item) => item.productId))];
    const now = new Date().toISOString();
    const idempotencyRef = adminDb
      .collection("order_idempotency")
      .doc(idempotencyDocumentId(user.uid, data.idempotencyKey));

    const result = await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(user.uid);
      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists || !activeUser(userSnapshot.data())) {
        throw new OrderRequestError("User account is not active", 403);
      }

      const idempotencySnapshot = await transaction.get(idempotencyRef);
      if (idempotencySnapshot.exists) {
        const existing = idempotencySnapshot.data() || {};
        if (existing.userId !== user.uid || existing.idempotencyKey !== data.idempotencyKey) {
          throw new OrderRequestError("Invalid idempotency key", 409);
        }
        if (typeof existing.orderId !== "string" || !existing.orderId) {
          throw new OrderRequestError("Order replay record is incomplete", 409);
        }
        const existingOrderRef = adminDb.collection("orders").doc(existing.orderId);
        const existingOrderSnapshot = await transaction.get(existingOrderRef);
        if (!existingOrderSnapshot.exists) {
          throw new OrderRequestError("Order replay record is incomplete", 409);
        }
        const existingOrder = existingOrderSnapshot.data() || {};
        return {
          orderId: existingOrderSnapshot.id,
          orderNumber: existingOrder.orderNumber,
          order: { id: existingOrderSnapshot.id, ...existingOrder },
        };
      }

      const products = new Map<string, FirebaseFirestore.DocumentData>();
      const productRefs = new Map<string, FirebaseFirestore.DocumentReference>();
      for (const productId of productIds) {
        const productRef = adminDb.collection("products").doc(productId);
        const productSnapshot = await transaction.get(productRef);
        if (!productSnapshot.exists) {
          throw new OrderRequestError("One or more selected products are unavailable", 400);
        }
        products.set(productId, productSnapshot.data()!);
        productRefs.set(productId, productRef);
      }

      const stockRequests = new Map<string, StockRequest>();
      const items: NormalizedOrderItem[] = data.items.map((item) => {
        const product = products.get(item.productId);
        const productRef = productRefs.get(item.productId);
        if (!product || !productRef) {
          throw new OrderRequestError("One or more selected products are unavailable", 400);
        }

        const variant = validateProductSelection(product, item);
        addStockRequest(
          stockRequests,
          item.productId,
          product,
          productRef,
          variant?.index,
          item.quantity
        );

        const normalizedItem: NormalizedOrderItem = {
          productId: item.productId,
          title: String(product.title || "Product"),
          price: money(variant?.value.price ?? product.price),
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          image: String(product.image || ""),
        };
        if (typeof product.slug === "string") normalizedItem.slug = product.slug;
        if (typeof variant?.value.sku === "string") normalizedItem.sku = variant.value.sku;
        else if (typeof product.sku === "string") normalizedItem.sku = product.sku;
        if (item.selectedColor) normalizedItem.selectedColor = item.selectedColor;
        return normalizedItem;
      });

      const subtotal = Math.round(
        items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
      ) / 100;
      let discount = 0;
      const couponCode = data.couponCode?.toUpperCase();
      let couponRef: FirebaseFirestore.DocumentReference | undefined;
      let coupon: FirebaseFirestore.DocumentData | undefined;
      if (couponCode) {
        const couponSnapshot = await transaction.get(
          adminDb
            .collection("coupons")
            .where("code", "==", couponCode)
            .where("isActive", "==", true)
            .limit(1)
        );
        if (couponSnapshot.empty) {
          throw new OrderRequestError("Invalid or expired coupon", 400);
        }
        couponRef = couponSnapshot.docs[0].ref;
        coupon = couponSnapshot.docs[0].data();

        const usageCount = Number(coupon.usageCount ?? 0);
        const usageLimit = coupon.usageLimit == null ? undefined : Number(coupon.usageLimit);
        if (
          !Number.isInteger(usageCount) ||
          usageCount < 0 ||
          (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 0 || usageCount >= usageLimit))
        ) {
          throw new OrderRequestError("Invalid or expired coupon", 400);
        }

        discount = calculateCouponDiscount(coupon, subtotal, now);
        if (discount <= 0) {
          throw new OrderRequestError("Invalid or expired coupon", 400);
        }
      }

      const isPriority = data.deliveryMethod.toLowerCase().includes("priority");
      const shipping = isPriority ? 150 : subtotal >= 999 ? 0 : 99;
      const total = Math.round(Math.max(0, subtotal - discount + shipping) * 100) / 100;
      if (total <= 0) throw new OrderRequestError("Invalid order total", 400);

      // All reads and validations above happen before writes. The product and
      // coupon updates therefore commit atomically with the order and replay
      // record, preventing oversells and coupon-limit races.
      for (const stockRequest of stockRequests.values()) {
        decrementStock(transaction, stockRequest, now);
      }
      if (couponRef && coupon) {
        transaction.update(couponRef, {
          usageCount: Number(coupon.usageCount ?? 0) + 1,
          updatedAt: now,
        });
      }

      const orderNumber = generateOrderNumber();
      const orderRef = adminDb.collection("orders").doc();
      const orderData = {
        orderNumber,
        userId: user.uid,
        items,
        subtotal,
        discount,
        couponCode: couponCode || null,
        shipping,
        total,
        status: "pending",
        statusHistory: [
          { status: "pending", timestamp: now, note: "COD order placed" },
        ],
        paymentMethod: "Cash on Delivery",
        paymentStatus: "cod_pending",
        shippingAddress: {
          ...data.shippingAddress,
          email: user.email || data.shippingAddress.email,
        },
        deliveryMethod: data.deliveryMethod,
        deliveryDateEstimate: isPriority ? "1-2 Business Days" : "4-5 Business Days",
        idempotencyKey: data.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(orderRef, orderData);
      transaction.create(idempotencyRef, {
        userId: user.uid,
        idempotencyKey: data.idempotencyKey,
        orderId: orderRef.id,
        orderNumber,
        createdAt: now,
      });

      return {
        orderId: orderRef.id,
        orderNumber,
        order: { id: orderRef.id, ...orderData },
      };
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      data: result.order,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error instanceof OrderRequestError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    console.error("[orders-create] Error:", error);
    return NextResponse.json({ success: false, error: "Unable to create order" }, { status: 500 });
  }
}
