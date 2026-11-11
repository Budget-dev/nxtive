import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import {
  AdminDataError,
  type AdminDataErrorState,
  type DashboardStats,
} from "../server/admin-data";
import type { Product, Category } from "@/types/product";
import type { Order, OrderStatus } from "@/types/order";
import type { Coupon } from "@/types/common";
import type { Customer, AdminUser, AdminRoleDefinition } from "@/types/user";
import type { Review } from "@/types/review";
import type { ShippingProvider, Shipment, ShippingLog } from "@/types/delivery";
import type { AdminAppSettings } from "@/types/settings";
import { ORDER_STATUS_TRANSITIONS } from "@/constants/order-status";

export { AdminDataError, type AdminDataErrorState, type DashboardStats };

export interface AdminAnalytics {
  dataState: "ready" | "empty";
  grossMerchandiseValue: number;
  checkoutConversionRate: number | null;
  repeatRate: number | null;
  categoryShare: { name: string; percentage: number; amount: number }[];
  paymentShare: { method: string; percentage: number }[];
  bestsellers: {
    title: string;
    category: string;
    unitsSold: number;
    revenue: number;
    returnRate: number | null;
  }[];
}

export interface AdminPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  date: string;
}

export interface AdminPaymentSettings {
  gateway: "razorpay";
  environmentMode: "test" | "live";
  keyId: string;
  enableCod: boolean;
  autoCapture: boolean;
  supportedMethods: {
    upi: boolean;
    cards: boolean;
    netbanking: boolean;
    wallets: boolean;
    cod: boolean;
  };
  updatedAt?: string;
}

export interface AdminShippingSettings {
  warehouseCode: string;
  warehouseAddress: string;
  contactPhone: string;
  contactEmail: string;
  updatedAt?: string;
}

export interface CollectionMeta {
  name: string;
  label: string;
  description: string;
  count: number;
  status: "ready" | "empty";
  isCore: boolean;
}

export interface DatabaseStatus {
  connected: boolean;
  project: string;
  source: string;
  error?: string;
  collections: CollectionMeta[];
  totalDocuments: number;
}

function normalizeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  if (Array.isArray(value)) return value.map(normalizeFirestoreValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeFirestoreValue(item),
      ])
    );
  }
  return value;
}

function sanitizeFirestorePayload(data: any): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data.map(sanitizeFirestorePayload);
  if (typeof data === "object" && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeFirestorePayload(v);
      }
    }
    return cleaned;
  }
  return data;
}

function fromDocument<T>(id: string, data: any): T {
  return {
    ...(normalizeFirestoreValue(data) as Record<string, unknown>),
    id,
  } as T;
}

async function readClientCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db as any, collectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map((docSnap: any) => fromDocument<T>(docSnap.id, docSnap.data()));
  } catch (error) {
    throw new AdminDataError(
      "error",
      `Reading Firestore collection "${collectionName}" is unavailable: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function readClientDocument<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return fromDocument<T>(snap.id, snap.data());
  } catch (error) {
    throw new AdminDataError(
      "error",
      `Reading Firestore document "${collectionName}/${id}" is unavailable: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function setClientDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
  merge = true
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, sanitizeFirestorePayload(data), { merge });
  } catch (error) {
    throw new AdminDataError(
      "error",
      `Saving Firestore document "${collectionName}/${id}" failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function updateClientDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, sanitizeFirestorePayload(data));
  } catch (error) {
    throw new AdminDataError(
      "error",
      `Updating Firestore document "${collectionName}/${id}" failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function deleteClientDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new AdminDataError(
      "error",
      `Deleting Firestore document "${collectionName}/${id}" failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function requiredId(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new Error(`${field} is invalid.`);
  }
  return value;
}

function requiredText(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function finiteNumber(value: unknown, field: string, minimum = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum) throw new Error(`${field} must be a valid number.`);
  return parsed;
}

function integerNumber(value: unknown, field: string, minimum = 0): number {
  const parsed = finiteNumber(value, field, minimum);
  if (!Number.isInteger(parsed)) throw new Error(`${field} must be a whole number.`);
  return parsed;
}

function boundedText(value: unknown, field: string, maxLength = 500): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredText(value, field, maxLength);
}

const ADMIN_PERMISSION_VALUES = new Set<string>([
  "dashboard.view",
  "products.view", "products.create", "products.edit", "products.delete",
  "orders.view", "orders.edit", "orders.cancel",
  "customers.view", "customers.edit", "customers.suspend",
  "reviews.view", "reviews.approve", "reviews.reject", "reviews.delete",
  "payments.view", "payments.manage",
  "shipping.view", "shipping.manage",
  "categories.view", "categories.edit",
  "coupons.view", "coupons.manage",
  "admins.view", "admins.manage", "settings.manage",
]);

function sortNewest<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  );
}

function getCustomerFromUser(id: string, raw: Record<string, unknown>): Customer {
  const accountStatus =
    raw.accountStatus === "suspended" || raw.accountStatus === "pending"
      ? (raw.accountStatus as Customer["accountStatus"])
      : raw.isActive === false
        ? "suspended"
        : "active";
  const addresses = Array.isArray(raw.addresses) ? (raw.addresses as any) : undefined;
  const rawEmail = String(raw.email ?? "");
  const fallbackName = rawEmail ? rawEmail.split("@")[0] : "Customer";
  const rawName = String(raw.name ?? raw.displayName ?? "").trim();
  const name = rawName || fallbackName;
  const role = String(raw.role ?? "");
  const isAdminUser = Boolean(raw.isAdmin || role === "admin" || role === "super_admin");

  return {
    id,
    name,
    email: rawEmail,
    phone: String(raw.phone ?? ""),
    city: typeof raw.city === "string" ? raw.city : undefined,
    state: typeof raw.state === "string" ? raw.state : undefined,
    accountStatus,
    ordersCount: Number(raw.ordersCount ?? 0),
    totalSpent: Number(raw.totalSpent ?? 0),
    registrationDate: String(raw.registrationDate ?? raw.createdAt ?? new Date().toISOString()),
    lastActivity: String(raw.lastActivity ?? raw.updatedAt ?? raw.createdAt ?? new Date().toISOString()),
    addresses,
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : typeof raw.photoURL === "string" ? raw.photoURL : undefined,
    segmentTier: (raw.segmentTier as Customer["segmentTier"]) || (Number(raw.ordersCount || 0) > 0 ? "Regular" : "New"),
    notes: typeof raw.notes === "string" ? raw.notes : isAdminUser ? `Role: ${role || "Admin"}` : undefined,
  };
}

async function readCustomers(existingOrders?: Order[]): Promise<Customer[]> {
  const [users, orders] = await Promise.all([
    readClientCollection<Record<string, unknown>>("users"),
    existingOrders ? Promise.resolve(existingOrders) : readClientCollection<Order>("orders"),
  ]);
  const aggregates = new Map<string, { ordersCount: number; totalSpent: number }>();
  orders
    .filter((order) => order.status !== "cancelled" && order.paymentStatus !== "failed" && order.paymentStatus !== "cancelled")
    .forEach((order) => {
      const keys = Array.from(new Set([order.userId, order.shippingAddress?.email?.toLowerCase()].filter(Boolean) as string[]));
      keys.forEach((key) => {
        const current = aggregates.get(key) || { ordersCount: 0, totalSpent: 0 };
        current.ordersCount += 1;
        current.totalSpent += Number(order.total || 0);
        aggregates.set(key, current);
      });
    });

  return users.map((user) => {
    const id = String(user.id);
    const email = String(user.email ?? "").toLowerCase();
    const aggregate = aggregates.get(id) || aggregates.get(email) || { ordersCount: 0, totalSpent: 0 };
    return {
      ...getCustomerFromUser(id, user),
      ordersCount: typeof user.ordersCount === "number" && user.ordersCount > aggregate.ordersCount ? user.ordersCount : aggregate.ordersCount,
      totalSpent: typeof user.totalSpent === "number" && user.totalSpent > aggregate.totalSpent ? user.totalSpent : aggregate.totalSpent,
    };
  });
}

function labelForDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await readClientCollection<Order>("orders");
  const [products, reviews, customers] = await Promise.all([
    readClientCollection<Product>("products"),
    readClientCollection<Review>("reviews"),
    readCustomers(orders),
  ]);

  const allOrders = sortNewest(orders).map((order: any) => ({
    ...order,
    total: Number(order.total ?? order.amount ?? order.totalAmount ?? 0),
    orderNumber: order.orderNumber || (order.id ? `#${String(order.id).slice(-6).toUpperCase()}` : "—"),
    status: order.status || "pending",
  }));
  const allReviews = sortNewest(reviews);
  const pendingOrders = allOrders.filter((order) =>
    order.status === "pending" || order.status === "processing"
  );
  const pendingReviews = allReviews.filter((review) => review.status === "pending");
  const paidOrders = allOrders.filter((order) => order.paymentStatus === "paid");
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const stockOverview = products
    .filter((product) => typeof product.totalStock === "number")
    .slice(0, 5)
    .map((product) => {
      const stock = Number(product.totalStock);
      const threshold = Number(product.lowStockThreshold ?? 0);
      const status: "In Stock" | "Low Stock" | "Out of Stock" =
        stock <= 0 ? "Out of Stock" : threshold > 0 && stock <= threshold ? "Low Stock" : "In Stock";
      return {
        id: product.id,
        name: product.title,
        sku: product.sku || "—",
        image: product.image || "",
        stock,
        status,
        price: Number(product.price || 0),
      };
    });

  const lowStockCount = products.filter((product) => {
    if (typeof product.totalStock !== "number") return false;
    const threshold = Number(product.lowStockThreshold ?? 0);
    return product.totalStock <= 0 || (threshold > 0 && product.totalStock <= threshold);
  }).length;

  const statusBreakdown: Record<string, number> = {};
  allOrders.forEach((order) => {
    statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
  });

  const trend = new Map<string, { date: string; amount: number; orders: number }>();
  for (const order of allOrders) {
    const date = new Date(order.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    const current = trend.get(key) || { date: labelForDate(date), amount: 0, orders: 0 };
    current.orders += 1;
    if (order.paymentStatus === "paid") current.amount += Number(order.total || 0);
    trend.set(key, current);
  }

  return {
    dataState:
      allOrders.length || products.length || customers.length || allReviews.length ? "ready" : "empty",
    totalRevenue,
    totalOrders: allOrders.length,
    totalProducts: products.length,
    totalCustomers: customers.length,
    pendingOrdersCount: pendingOrders.length,
    pendingReviewsCount: pendingReviews.length,
    lowStockCount,
    averageOrderValue: paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0,
    recentOrders: allOrders.slice(0, 5),
    pendingReviews: pendingReviews.slice(0, 4),
    stockOverview,
    statusBreakdown,
    revenueTrend: Array.from(trend.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-7)
      .map(([, value]) => value),
  };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [orders, products] = await Promise.all([
    readClientCollection<Order>("orders"),
    readClientCollection<Product>("products"),
  ]);
  const validOrders = orders.filter((order) => order.status !== "cancelled");
  const grossMerchandiseValue = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const customerOrders = new Map<string, number>();
  validOrders
    .filter((order) => order.userId && order.userId !== "guest")
    .forEach((order) => customerOrders.set(order.userId, (customerOrders.get(order.userId) || 0) + 1));
  const repeatCustomers = Array.from(customerOrders.values()).filter((count) => count > 1).length;
  const repeatRate = customerOrders.size ? (repeatCustomers / customerOrders.size) * 100 : null;

  const categoryTotals = new Map<string, number>();
  const bestsellerTotals = new Map<string, { title: string; category: string; unitsSold: number; revenue: number; orderCount: number; returnedCount: number }>();
  const productById = new Map(products.map((product) => [product.id, product]));
  const paymentTotals = new Map<string, number>();
  validOrders.forEach((order) => {
    const paymentMethod = order.paymentMethod || "Unknown";
    paymentTotals.set(paymentMethod, (paymentTotals.get(paymentMethod) || 0) + 1);
    const returned = order.status === "returned" || order.status === "return_requested";
    order.items?.forEach((item) => {
      const product = productById.get(item.productId);
      const category = product?.category || "Uncategorized";
      const revenue = Number(item.price || 0) * Number(item.quantity || 0);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + revenue);
      const current = bestsellerTotals.get(item.productId) || {
        title: item.title,
        category,
        unitsSold: 0,
        revenue: 0,
        orderCount: 0,
        returnedCount: 0,
      };
      current.unitsSold += Number(item.quantity || 0);
      current.revenue += revenue;
      current.orderCount += 1;
      if (returned) current.returnedCount += 1;
      bestsellerTotals.set(item.productId, current);
    });
  });

  const totalCategoryRevenue = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0);
  const totalPayments = validOrders.length;
  return {
    dataState: orders.length || products.length ? "ready" : "empty",
    grossMerchandiseValue,
    checkoutConversionRate: null,
    repeatRate,
    categoryShare: Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalCategoryRevenue ? (amount / totalCategoryRevenue) * 100 : 0,
      }))
      .sort((left, right) => right.amount - left.amount),
    paymentShare: Array.from(paymentTotals.entries())
      .map(([method, count]) => ({
        method,
        percentage: totalPayments ? (count / totalPayments) * 100 : 0,
      }))
      .sort((left, right) => right.percentage - left.percentage),
    bestsellers: Array.from(bestsellerTotals.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 10)
      .map((item) => ({
        title: item.title,
        category: item.category,
        unitsSold: item.unitsSold,
        revenue: item.revenue,
        returnRate: item.orderCount ? (item.returnedCount / item.orderCount) * 100 : null,
      })),
  };
}

// ============================================================================
// PRODUCTS & INVENTORY
// ============================================================================

export async function getAdminProducts(filter?: {
  category?: string;
  search?: string;
  stockStatus?: string;
}): Promise<Product[]> {
  if (filter?.category !== undefined) boundedText(filter.category, "Category filter", 120);
  if (filter?.search !== undefined) boundedText(filter.search, "Product search", 200);
  if (filter?.stockStatus !== undefined && !["all", "in", "low", "out"].includes(filter.stockStatus)) {
    throw new Error("Stock filter is invalid.");
  }
  let products = await readClientCollection<Product>("products");
  if (filter?.category && filter.category !== "all") {
    products = products.filter((product) => product.category?.toLowerCase() === filter.category?.toLowerCase());
  }
  if (filter?.search?.trim()) {
    const query = filter.search.toLowerCase();
    products = products.filter(
      (product) =>
        product.title?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    );
  }
  if (filter?.stockStatus && filter.stockStatus !== "all") {
    products = products.filter((product) => {
      if (typeof product.totalStock !== "number") return false;
      const threshold = Number(product.lowStockThreshold ?? 0);
      if (filter.stockStatus === "low") return product.totalStock > 0 && threshold > 0 && product.totalStock <= threshold;
      if (filter.stockStatus === "out") return product.totalStock <= 0;
      if (filter.stockStatus === "in") return product.totalStock > 0 && (threshold <= 0 || product.totalStock > threshold);
      return true;
    });
  }
  return products;
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  requiredId(id, "Product id");
  const direct = await readClientDocument<Product>("products", id);
  if (direct) return direct;
  const products = await readClientCollection<Product>("products");
  return products.find((product) => product.slug === id || product.sku === id) || null;
}

export async function saveProduct(
  product: Partial<Product>
): Promise<{ success: boolean; id: string; error?: string }> {
  if (!product || typeof product !== "object") throw new Error("Product data is required.");
  const id = product.id || newId("prod");
  const existing = product.id ? await readClientDocument<Product>("products", id) : null;
  if (product.id && !existing) return { success: false, id, error: "Product not found" };

  const title = product.title ?? existing?.title;
  const slug = product.slug ?? existing?.slug;
  const category = product.category ?? existing?.category;
  const image = product.image ?? existing?.image;
  if (!title || !slug || !category || !image || (product.price === undefined && existing?.price === undefined)) {
    throw new Error("A product title, slug, category, image, and price are required.");
  }
  requiredText(title, "Product title", 200);
  if (!/^[a-z0-9-]{2,160}$/.test(slug)) throw new Error("Product slug is invalid.");
  requiredText(category, "Product category", 80);
  requiredText(image, "Product image", 2048);
  finiteNumber(product.price ?? existing?.price, "Product price", 0.01);
  if (product.totalStock !== undefined) integerNumber(product.totalStock, "Product stock");
  if (product.lowStockThreshold !== undefined) integerNumber(product.lowStockThreshold, "Low-stock threshold");
  if (product.colors !== undefined && (!Array.isArray(product.colors) || product.colors.length === 0)) {
    throw new Error("At least one product color is required.");
  }
  if (product.sizes !== undefined && (!Array.isArray(product.sizes) || product.sizes.length === 0)) {
    throw new Error("At least one product size is required.");
  }

  const now = new Date().toISOString();
  const fullProduct: Product = {
    ...(existing || {}),
    ...product,
    id,
    title,
    slug,
    category,
    categoryId: (product as any).categoryId || (existing as any)?.categoryId || (category ? String(category).toLowerCase().replace(/\s+/g, "-") : undefined),
    image,
    imageUrl: (product as any).imageUrl || image,
    price: Number(product.price ?? existing?.price),
    originalPrice: "originalPrice" in product ? (product.originalPrice ?? null) : (existing?.originalPrice ?? null),
    images: product.images ?? existing?.images ?? [image],
    collections: product.collections ?? existing?.collections ?? [],
    badge: "badge" in product ? (product.badge ?? null) : (existing?.badge ?? null),
    colors: product.colors ?? existing?.colors ?? [],
    sizes: product.sizes ?? existing?.sizes ?? [],
    description: product.description ?? existing?.description ?? "",
    details: product.details ?? existing?.details ?? [],
    fabricCare: product.fabricCare ?? existing?.fabricCare ?? [],
    fit: product.fit ?? existing?.fit ?? "",
    rating: Number(product.rating ?? existing?.rating ?? 0),
    reviewCount: Number(product.reviewCount ?? existing?.reviewCount ?? 0),
    inStock: product.inStock ?? existing?.inStock ?? Number(product.totalStock ?? existing?.totalStock ?? 0) > 0,
    totalStock: product.totalStock ?? existing?.totalStock,
    lowStockThreshold: product.lowStockThreshold ?? existing?.lowStockThreshold,
    featured: product.featured ?? existing?.featured ?? false,
    isActive: product.isActive ?? existing?.isActive ?? true,
    variants: product.variants ?? existing?.variants ?? [],
    createdAt: existing?.createdAt ?? product.createdAt ?? now,
    updatedAt: now,
  };

  await setClientDocument("products", id, fullProduct as unknown as Record<string, unknown>);
  return { success: true, id };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Product id");
  const product = await readClientDocument<Product>("products", id);
  if (!product) return { success: false, error: "Product not found" };
  await deleteClientDocument("products", id);
  return { success: true };
}

export async function updateStockLevel(
  productId: string,
  newStock: number
): Promise<{ success: boolean; error?: string }> {
  requiredId(productId, "Product id");
  integerNumber(newStock, "Product stock");
  const product = await readClientDocument<Product>("products", productId);
  if (!product) return { success: false, error: "Product not found" };
  const stock = Math.max(0, Number(newStock));
  await updateClientDocument("products", productId, {
    totalStock: stock,
    inStock: stock > 0,
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function getAdminInventory(): Promise<{
  products: Product[];
  lowStockItems: { product: Product; variant: any }[];
}> {
  const products = await getAdminProducts();
  const lowStockItems: { product: Product; variant: any }[] = [];
  products.forEach((product) => {
    if (product.variants?.length) {
      product.variants.forEach((variant) => {
        if (typeof variant.stock === "number" && variant.stock <= 5) {
          lowStockItems.push({ product, variant });
        }
      });
    } else if (
      typeof product.totalStock === "number" &&
      typeof product.lowStockThreshold === "number" &&
      product.totalStock <= product.lowStockThreshold
    ) {
      lowStockItems.push({
        product,
        variant: {
          sku: product.sku || product.slug,
          size: "All",
          color: "Standard",
          stock: product.totalStock,
        },
      });
    }
  });
  return { products, lowStockItems };
}

// ============================================================================
// ORDERS & CUSTOMERS
// ============================================================================

export async function getAdminOrders(filter?: { status?: string; search?: string }): Promise<Order[]> {
  if (filter?.status !== undefined && !Object.prototype.hasOwnProperty.call(ORDER_STATUS_TRANSITIONS, filter.status) && filter.status !== "all") {
    throw new Error("Order status filter is invalid.");
  }
  if (filter?.search !== undefined) boundedText(filter.search, "Order search", 200);
  let orders = sortNewest(await readClientCollection<Order>("orders")).map((order: any) => ({
    ...order,
    total: Number(order.total ?? order.amount ?? order.totalAmount ?? 0),
    orderNumber: order.orderNumber || (order.id ? `#${String(order.id).slice(-6).toUpperCase()}` : "—"),
    status: order.status || "pending",
  }));
  if (filter?.status && filter.status !== "all") {
    orders = orders.filter((order) => order.status?.toLowerCase() === filter.status?.toLowerCase());
  }
  if (filter?.search?.trim()) {
    const query = filter.search.toLowerCase();
    orders = orders.filter(
      (order) =>
        order.orderNumber?.toLowerCase().includes(query) ||
        order.shippingAddress?.fullName?.toLowerCase().includes(query) ||
        order.shippingAddress?.email?.toLowerCase().includes(query) ||
        order.shippingAddress?.phone?.includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query)
    );
  }
  return orders;
}

export async function getAdminOrderById(orderId: string): Promise<Order | null> {
  requiredId(orderId, "Order id");
  const direct = await readClientDocument<Order>("orders", orderId);
  if (direct) return direct;
  const orders = await readClientCollection<Order>("orders");
  return orders.find((order) => order.orderNumber === orderId || order.id === orderId) || null;
}

export async function saveAdminOrder(
  order: Partial<Order>
): Promise<{ success: boolean; id: string; order: Order }> {
  if (!order || typeof order !== "object") throw new Error("Order data is required.");
  if (order.id) requiredId(order.id, "Order id");
  const id = order.id || newId("ord");
  const existing = await readClientDocument<Order>("orders", id);
  const now = new Date().toISOString();
  const orderNumber = order.orderNumber ?? existing?.orderNumber;
  const userId = order.userId ?? existing?.userId;
  const items = order.items ?? existing?.items;
  const paymentMethod = order.paymentMethod ?? existing?.paymentMethod;
  const shippingAddress = order.shippingAddress ?? existing?.shippingAddress;
  const deliveryMethod = order.deliveryMethod ?? existing?.deliveryMethod;
  const status = order.status ?? existing?.status;
  const paymentStatus = order.paymentStatus ?? existing?.paymentStatus;
  if (!orderNumber || !userId || !items || !paymentMethod || !shippingAddress || !deliveryMethod || !status || !paymentStatus) {
    throw new Error("Order data is incomplete.");
  }
  requiredText(orderNumber, "Order number", 128);
  requiredText(userId, "User id", 128);
  if (!Array.isArray(items) || items.length === 0) throw new Error("An order must contain at least one item.");
  requiredText(paymentMethod, "Payment method", 120);
  requiredText(deliveryMethod, "Delivery method", 160);
  requiredText(shippingAddress.fullName, "Shipping name", 160);
  requiredText(shippingAddress.email, "Shipping email", 320);
  requiredText(shippingAddress.phone, "Shipping phone", 64);
  if (!Object.prototype.hasOwnProperty.call(ORDER_STATUS_TRANSITIONS, status)) throw new Error("Order status is invalid.");
  if (!["pending", "paid", "failed", "cancelled", "refund_initiated", "refunded", "cod_pending"].includes(paymentStatus)) {
    throw new Error("Payment status is invalid.");
  }
  finiteNumber(order.subtotal ?? existing?.subtotal, "Order subtotal");
  finiteNumber(order.discount ?? existing?.discount, "Order discount");
  finiteNumber(order.shipping ?? existing?.shipping, "Order shipping");
  finiteNumber(order.total ?? existing?.total, "Order total");
  const fullOrder: Order = {
    ...(existing || {}),
    ...order,
    id,
    orderNumber,
    userId,
    items,
    subtotal: Number(order.subtotal ?? existing?.subtotal ?? 0),
    discount: Number(order.discount ?? existing?.discount ?? 0),
    shipping: Number(order.shipping ?? existing?.shipping ?? 0),
    total: Number(order.total ?? existing?.total ?? 0),
    status,
    statusHistory:
      order.statusHistory ??
      existing?.statusHistory ??
      [{ status, timestamp: now, note: "Order placed", updatedBy: "system" }],
    paymentMethod,
    paymentStatus,
    shippingAddress,
    deliveryMethod,
    createdAt: existing?.createdAt ?? order.createdAt ?? now,
    updatedAt: now,
  };
  await setClientDocument("orders", id, fullOrder as unknown as Record<string, unknown>);
  return { success: true, id, order: fullOrder };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  tracking?: { trackingNumber?: string; trackingUrl?: string; provider?: string }
): Promise<{ success: boolean; error?: string }> {
  requiredId(orderId, "Order id");
  if (!Object.prototype.hasOwnProperty.call(ORDER_STATUS_TRANSITIONS, newStatus)) {
    throw new Error("Order status is invalid.");
  }
  boundedText(note, "Status note", 500);
  if (tracking?.trackingNumber !== undefined) requiredText(tracking.trackingNumber, "Tracking number", 128);
  if (tracking?.trackingUrl !== undefined) requiredText(tracking.trackingUrl, "Tracking URL", 2048);
  let order = await readClientDocument<Order>("orders", orderId);
  if (!order) {
    const all = await readClientCollection<Order>("orders");
    order = all.find((o) => o.orderNumber === orderId || o.id === orderId) || null;
  }
  if (!order) return { success: false, error: "Order not found" };
  const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus) && newStatus !== order.status) {
    return { success: false, error: `Invalid transition from "${order.status}" to "${newStatus}".` };
  }
  const now = new Date().toISOString();
  const statusHistory = [
    ...(order.statusHistory || []),
    { status: newStatus, timestamp: now, note: note || `Status changed to ${newStatus}`, updatedBy: "admin" },
  ];
  await updateClientDocument("orders", order.id, {
    status: newStatus,
    statusHistory,
    trackingNumber: tracking?.trackingNumber ?? order.trackingNumber ?? null,
    trackingUrl: tracking?.trackingUrl ?? order.trackingUrl ?? null,
    updatedAt: now,
    ...(newStatus === "refund_initiated" || newStatus === "refunded"
      ? { paymentStatus: newStatus }
      : newStatus === "delivered" && (order.paymentStatus === "cod_pending" || String(order.paymentMethod || "").toLowerCase().includes("cash"))
        ? { paymentStatus: "paid" }
        : {}),
  });
  return { success: true };
}

export async function updateOrderPaymentStatus(
  orderId: string,
  newPaymentStatus: "pending" | "paid" | "failed" | "cancelled" | "refund_initiated" | "refunded" | "cod_pending",
  note?: string
): Promise<{ success: boolean; error?: string }> {
  requiredId(orderId, "Order id");
  let order = await readClientDocument<Order>("orders", orderId);
  if (!order) {
    const all = await readClientCollection<Order>("orders");
    order = all.find((o) => o.orderNumber === orderId || o.id === orderId) || null;
  }
  if (!order) return { success: false, error: "Order not found" };
  const now = new Date().toISOString();
  await updateClientDocument("orders", order.id, {
    paymentStatus: newPaymentStatus,
    updatedAt: now,
    statusHistory: [
      ...(order.statusHistory || []),
      {
        status: order.status,
        timestamp: now,
        note: note || `Payment status updated to ${newPaymentStatus}`,
        updatedBy: "admin",
      },
    ],
  });
  return { success: true };
}

export async function assignShippingToOrder(
  orderId: string,
  provider: string,
  trackingNumber: string,
  trackingUrl?: string
): Promise<{ success: boolean; error?: string }> {
  requiredId(orderId, "Order id");
  requiredText(provider, "Shipping provider", 120);
  requiredText(trackingNumber, "Tracking number", 128);
  boundedText(trackingUrl, "Tracking URL", 2048);
  const order = await readClientDocument<Order>("orders", orderId);
  if (!order) return { success: false, error: "Order not found" };
  const now = new Date().toISOString();
  const shipmentId = newId("shp");
  const shipment: Shipment = {
    id: shipmentId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.shippingAddress?.fullName,
    destinationCity: order.shippingAddress?.city,
    provider: provider.toLowerCase(),
    providerName: provider,
    trackingNumber,
    trackingUrl,
    status: "picked_up",
    events: [
      {
        status: "picked_up",
        timestamp: now,
        description: `Shipment assigned to ${provider} with tracking number ${trackingNumber}`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  await updateClientDocument("orders", order.id, {
    trackingNumber,
    trackingUrl: trackingUrl ?? null,
    deliveryMethod: provider,
    updatedAt: now,
  });
  await setClientDocument("shipments", shipmentId, shipment as unknown as Record<string, unknown>, false);
  return { success: true };
}

export async function getAdminCustomers(search?: string): Promise<Customer[]> {
  if (search !== undefined) boundedText(search, "Customer search", 200);
  let customers = await readCustomers();
  if (search?.trim()) {
    const query = search.toLowerCase();
    customers = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.city?.toLowerCase().includes(query)
    );
  }
  return customers;
}

export async function getAdminCustomerById(id: string): Promise<Customer | null> {
  requiredId(id, "Customer id");
  const customers = await readCustomers();
  return customers.find((customer) => customer.id === id) || null;
}

export async function updateCustomerStatus(
  id: string,
  accountStatus: "active" | "suspended"
): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Customer id");
  if (accountStatus !== "active" && accountStatus !== "suspended") throw new Error("Customer status is invalid.");
  const customer = await readClientDocument<Record<string, unknown>>("users", id);
  if (!customer) return { success: false, error: "Customer not found" };
  await updateClientDocument("users", id, {
    accountStatus,
    isActive: accountStatus === "active",
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function updateCustomerDetails(
  id: string,
  data: Partial<Customer>
): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Customer id");
  if (!data || typeof data !== "object") throw new Error("Customer details are required.");
  if (data.phone !== undefined) boundedText(data.phone, "Customer phone", 64);
  if (data.notes !== undefined) boundedText(data.notes, "Customer notes", 2000);
  const customer = await readClientDocument<Record<string, unknown>>("users", id);
  if (!customer) return { success: false, error: "Customer not found" };
  const { id: ignoredId, ...fields } = data;
  await updateClientDocument("users", id, { ...fields, updatedAt: new Date().toISOString() });
  return { success: true };
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function getAdminReviews(filter?: { status?: string; search?: string }): Promise<Review[]> {
  if (filter?.status !== undefined && !["all", "pending", "approved", "rejected"].includes(filter.status)) {
    throw new Error("Review status filter is invalid.");
  }
  if (filter?.search !== undefined) boundedText(filter.search, "Review search", 200);
  let reviews = sortNewest(await readClientCollection<Review>("reviews"));
  if (filter?.status && filter.status !== "all") {
    reviews = reviews.filter((review) => review.status?.toLowerCase() === filter.status?.toLowerCase());
  }
  if (filter?.search?.trim()) {
    const query = filter.search.toLowerCase();
    reviews = reviews.filter(
      (review) =>
        review.userName?.toLowerCase().includes(query) ||
        review.productTitle?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query)
    );
  }
  return reviews;
}

export async function approveReview(
  id: string,
  adminName = "Admin"
): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Review id");
  requiredText(adminName, "Admin name", 120);
  const review = await readClientDocument<Review>("reviews", id);
  if (!review) return { success: false, error: "Review not found" };
  const now = new Date().toISOString();
  await updateClientDocument("reviews", id, {
    status: "approved",
    moderatedBy: adminName,
    moderatedAt: now,
    updatedAt: now,
  });
  return { success: true };
}

export async function rejectReview(
  id: string,
  adminName = "Admin",
  moderationNotes?: string
): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Review id");
  requiredText(adminName, "Admin name", 120);
  boundedText(moderationNotes, "Moderation notes", 2000);
  const review = await readClientDocument<Review>("reviews", id);
  if (!review) return { success: false, error: "Review not found" };
  const now = new Date().toISOString();
  await updateClientDocument("reviews", id, {
    status: "rejected",
    moderatedBy: adminName,
    moderatedAt: now,
    moderationNotes: moderationNotes || "Rejected by administrator",
    updatedAt: now,
  });
  return { success: true };
}

export async function deleteReview(id: string): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Review id");
  const review = await readClientDocument<Review>("reviews", id);
  if (!review) return { success: false, error: "Review not found" };
  await deleteClientDocument("reviews", id);
  return { success: true };
}

export async function getPublicApprovedReviews(productId?: string): Promise<Review[]> {
  if (productId !== undefined) requiredId(productId, "Product id");
  const all = await readClientCollection<Review>("reviews");
  const filtered = all.filter((r) => r.status === "approved" && (!productId || r.productId === productId));
  return sortNewest(filtered);
}

export async function submitCustomerReview(input: {
  productId: string;
  productTitle: string;
  productSlug?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  sizePurchased?: string;
}): Promise<{ success: boolean; id: string }> {
  const currentUser = auth.currentUser;
  requiredId(input.productId, "Product id");
  requiredText(input.userName, "Reviewer name", 160);
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5 || !input.comment?.trim()) {
    throw new Error("Enter a rating from 1 to 5 and a review comment.");
  }
  requiredText(input.comment, "Review comment", 4000);
  boundedText(input.sizePurchased, "Purchased size", 32);
  const product = await readClientDocument<Product>("products", input.productId);
  if (!product) throw new Error("Product not found");
  const id = newId("rev");
  const now = new Date().toISOString();
  const review: Review = {
    id,
    productId: input.productId,
    productTitle: product.title,
    productSlug: product.slug,
    userId: currentUser?.uid || "guest",
    userName: input.userName,
    userEmail: input.userEmail || currentUser?.email || undefined,
    rating: input.rating,
    comment: input.comment,
    sizePurchased: input.sizePurchased,
    status: "pending",
    verifiedBuyer: false,
    createdAt: now,
  };
  await setClientDocument("reviews", id, review as unknown as Record<string, unknown>, false);
  return { success: true, id };
}

// ============================================================================
// PAYMENTS
// ============================================================================

export async function getAdminPayments(): Promise<AdminPayment[]> {
  const orders = sortNewest(await readClientCollection<Order>("orders"));
  return orders.map((order) => ({
    id: order.razorpayPaymentId || order.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.shippingAddress?.fullName || "",
    amount: Number(order.total || 0),
    currency: "INR",
    method: order.paymentMethod || "",
    status: order.paymentStatus || "pending",
    razorpayOrderId: order.razorpayOrderId || "",
    razorpayPaymentId: order.razorpayPaymentId || "",
    date: order.createdAt,
  }));
}

export async function issueRefund(
  orderId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  requiredId(orderId, "Order id");
  finiteNumber(amount, "Refund amount", 0.01);
  requiredText(reason, "Refund reason", 1000);
  return {
    success: false,
    error: "Refunds are unavailable until the payment provider refund integration is implemented.",
  };
}

// ============================================================================
// SHIPPING
// ============================================================================

export async function getAdminShippingProviders(): Promise<ShippingProvider[]> {
  return readClientCollection<ShippingProvider>("shipping_providers");
}

export async function saveShippingProvider(
  provider: Partial<ShippingProvider>
): Promise<{ success: boolean; id: string }> {
  if (!provider || typeof provider !== "object") throw new Error("Shipping provider data is required.");
  if (provider.id) requiredId(provider.id, "Shipping provider id");
  const id = provider.id || newId("sp");
  const existing = provider.id ? await readClientDocument<ShippingProvider>("shipping_providers", id) : null;
  if (provider.id && !existing) throw new Error("Shipping provider not found");
  if (!provider.name && !existing?.name) throw new Error("A shipping provider name is required.");
  if (!provider.slug && !existing?.slug) throw new Error("A shipping provider slug is required.");
  requiredText(provider.name ?? existing?.name, "Shipping provider name", 160);
  if (!/^[a-z0-9_-]{1,80}$/i.test(String(provider.slug ?? existing?.slug))) throw new Error("Shipping provider slug is invalid.");
  boundedText(provider.description ?? existing?.description, "Shipping provider description", 2000);
  boundedText(provider.trackingUrlTemplate ?? existing?.trackingUrlTemplate, "Tracking URL template", 2048);
  const now = new Date().toISOString();
  const full: ShippingProvider = {
    ...(existing || {}),
    ...provider,
    id,
    name: provider.name ?? existing!.name,
    slug: provider.slug ?? existing!.slug,
    description: provider.description ?? existing?.description ?? "",
    isEnabled: provider.isEnabled ?? existing?.isEnabled ?? true,
    isDefault: provider.isDefault ?? existing?.isDefault ?? false,
    trackingUrlTemplate: provider.trackingUrlTemplate ?? existing?.trackingUrlTemplate,
    supportedRegions: provider.supportedRegions ?? existing?.supportedRegions,
    estimatedTransitDays: provider.estimatedTransitDays ?? existing?.estimatedTransitDays,
    config: { ...(existing?.config || {}), ...(provider.config || {}) },
    createdAt: existing?.createdAt ?? provider.createdAt ?? now,
    updatedAt: now,
  };
  await setClientDocument("shipping_providers", id, full as unknown as Record<string, unknown>);
  return { success: true, id };
}

export async function toggleShippingProvider(
  id: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Shipping provider id");
  if (typeof isEnabled !== "boolean") throw new Error("Shipping provider status is invalid.");
  const provider = await readClientDocument<ShippingProvider>("shipping_providers", id);
  if (!provider) return { success: false, error: "Shipping provider not found" };
  await updateClientDocument("shipping_providers", id, { isEnabled, updatedAt: new Date().toISOString() });
  return { success: true };
}

export async function setDefaultShippingProvider(id: string): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Shipping provider id");
  const providers = await readClientCollection<ShippingProvider>("shipping_providers");
  if (!providers.some((provider) => provider.id === id)) return { success: false, error: "Shipping provider not found" };
  const batch = writeBatch(db);
  providers.forEach((provider) => {
    batch.update(doc(db, "shipping_providers", provider.id), { isDefault: provider.id === id });
  });
  await batch.commit();
  return { success: true };
}

export async function getAdminShipments(): Promise<Shipment[]> {
  return sortNewest(await readClientCollection<Shipment>("shipments"));
}

export async function getAdminShippingLogs(): Promise<ShippingLog[]> {
  const logs = await readClientCollection<ShippingLog>("shipping_logs");
  return [...logs].sort(
    (left, right) =>
      new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime()
  );
}

// ============================================================================
// ADMIN USERS & ROLES
// ============================================================================

export async function getAdminUsers(): Promise<AdminUser[]> {
  return readClientCollection<AdminUser>("admin_users");
}

export async function saveAdminUser(
  user: Partial<AdminUser>
): Promise<{ success: boolean; uid: string }> {
  if (!user || typeof user !== "object") throw new Error("Admin user data is required.");
  if (user.uid) requiredId(user.uid, "Admin user id");
  const uid = user.uid || newId("adm");
  const existing = user.uid ? await readClientDocument<AdminUser>("admin_users", uid) : null;
  if (user.uid && !existing) throw new Error("Admin user not found");
  if (!user.email && !existing?.email) throw new Error("An admin email is required.");
  if (!user.displayName && !existing?.displayName) throw new Error("An admin display name is required.");
  const email = String(user.email ?? existing?.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) throw new Error("Admin email is invalid.");
  requiredText(user.displayName ?? existing?.displayName, "Admin display name", 160);
  const roles = await readClientCollection<AdminRoleDefinition>("admin_roles");
  const role = user.role ?? existing?.role ?? "";
  const roleDef = roles.find((item) => item.slug === role);
  if (!roleDef || (roleDef.isSystem && roleDef.slug !== "super_admin" && !roleDef.permissions.length)) {
    throw new Error("Choose a valid persisted admin role.");
  }
  if (user.permissions !== undefined && (!Array.isArray(user.permissions) || user.permissions.some((permission) => !ADMIN_PERMISSION_VALUES.has(permission)))) {
    throw new Error("Admin permissions are invalid.");
  }
  const fullUser: AdminUser = {
    ...(existing || {}),
    ...user,
    uid,
    email,
    displayName: user.displayName ?? existing!.displayName,
    role,
    roleName: user.roleName ?? existing?.roleName ?? roleDef?.name,
    permissions: roleDef.permissions,
    isActive: user.isActive ?? existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? user.createdAt ?? new Date().toISOString(),
  };
  await setClientDocument("admin_users", uid, fullUser as unknown as Record<string, unknown>);
  return { success: true, uid };
}

export async function toggleAdminUserStatus(
  uid: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  requiredId(uid, "Admin user id");
  if (typeof isActive !== "boolean") throw new Error("Admin user status is invalid.");
  const user = await readClientDocument<AdminUser>("admin_users", uid);
  if (!user) return { success: false, error: "Admin user not found" };
  await updateClientDocument("admin_users", uid, { isActive });
  return { success: true };
}

export async function getAdminRoles(): Promise<AdminRoleDefinition[]> {
  return readClientCollection<AdminRoleDefinition>("admin_roles");
}

export async function saveAdminRole(
  role: Partial<AdminRoleDefinition>
): Promise<{ success: boolean; id: string }> {
  if (!role || typeof role !== "object") throw new Error("Admin role data is required.");
  if (role.id) requiredId(role.id, "Admin role id");
  const id = role.id || newId("role");
  const existing = role.id ? await readClientDocument<AdminRoleDefinition>("admin_roles", id) : null;
  if (role.id && !existing) throw new Error("Admin role not found");
  if (!role.name && !existing?.name) throw new Error("A role name is required.");
  if (!role.slug && !existing?.slug) throw new Error("A role slug is required.");
  requiredText(role.name ?? existing?.name, "Role name", 120);
  const roleSlug = String(role.slug ?? existing?.slug);
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(roleSlug)) throw new Error("Role slug is invalid.");
  if (role.permissions !== undefined) {
    if (!Array.isArray(role.permissions) || role.permissions.some((permission) => !ADMIN_PERMISSION_VALUES.has(permission))) {
      throw new Error("Role permissions are invalid.");
    }
  }
  if (role.isSystem === true || existing?.isSystem === true || roleSlug === "super_admin") {
    throw new Error("System roles cannot be created or modified here.");
  }
  const fullRole: AdminRoleDefinition = {
    ...(existing || {}),
    ...role,
    id,
    name: role.name ?? existing!.name,
    slug: role.slug ?? existing!.slug,
    description: role.description ?? existing?.description ?? "",
    isSystem: false,
    permissions: role.permissions ?? existing?.permissions ?? [],
    createdAt: existing?.createdAt ?? role.createdAt ?? new Date().toISOString(),
  };
  await setClientDocument("admin_roles", id, fullRole as unknown as Record<string, unknown>);
  return { success: true, id };
}

// ============================================================================
// SETTINGS, CATEGORIES & COUPONS
// ============================================================================

export async function getAdminSettings(): Promise<AdminAppSettings | null> {
  return readClientDocument<AdminAppSettings>("settings", "global");
}

export async function saveAdminSettings(
  settings: Partial<AdminAppSettings>
): Promise<{ success: boolean }> {
  if (!settings || typeof settings !== "object") throw new Error("Settings data is required.");
  if (settings.general) {
    requiredText(settings.general.storeName, "Store name", 160);
    requiredText(settings.general.supportEmail, "Support email", 320);
    finiteNumber(settings.general.taxRatePercent, "Tax rate");
  }
  if (settings.store) {
    integerNumber(settings.store.lowStockThreshold, "Low-stock threshold");
    finiteNumber(settings.store.freeShippingThreshold, "Free-shipping threshold");
    finiteNumber(settings.store.standardShippingFee, "Standard shipping fee");
    finiteNumber(settings.store.priorityShippingFee, "Priority shipping fee");
    integerNumber(settings.store.returnWindowDays, "Return window");
  }
  await setClientDocument("settings", "global", {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function getAdminPaymentSettings(): Promise<AdminPaymentSettings | null> {
  return readClientDocument<AdminPaymentSettings>("payment_settings", "global");
}

export async function saveAdminPaymentSettings(
  settings: AdminPaymentSettings
): Promise<{ success: boolean }> {
  if (!settings || settings.gateway !== "razorpay" || !["test", "live"].includes(settings.environmentMode)) {
    throw new Error("Payment settings are invalid.");
  }
  requiredText(settings.keyId, "Payment key id", 320);
  if (!settings.supportedMethods || Object.values(settings.supportedMethods).some((value) => typeof value !== "boolean")) {
    throw new Error("Payment method settings are invalid.");
  }
  await setClientDocument("payment_settings", "global", {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function getAdminShippingSettings(): Promise<AdminShippingSettings | null> {
  return readClientDocument<AdminShippingSettings>("shipping_settings", "global");
}

export async function saveAdminShippingSettings(
  settings: AdminShippingSettings
): Promise<{ success: boolean }> {
  requiredText(settings.warehouseCode, "Warehouse code", 120);
  requiredText(settings.warehouseAddress, "Warehouse address", 1000);
  requiredText(settings.contactPhone, "Dispatch phone", 64);
  requiredText(settings.contactEmail, "Dispatch email", 320);
  await setClientDocument("shipping_settings", "global", {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function getAdminCategories(): Promise<Category[]> {
  return readClientCollection<Category>("categories");
}

export async function saveCategory(
  category: Partial<Category>
): Promise<{ success: boolean; id: string }> {
  if (!category || typeof category !== "object") throw new Error("Category data is required.");
  if (category.id) requiredId(category.id, "Category id");
  const id = category.id || newId("cat");
  const existing = category.id ? await readClientDocument<Category>("categories", id) : null;
  if (category.id && !existing) throw new Error("Category not found");
  const name = category.name ?? existing?.name;
  if (!name) throw new Error("A category name is required.");
  requiredText(name, "Category name", 120);
  if (category.slug !== undefined && !/^[a-z0-9-]{1,120}$/.test(category.slug)) throw new Error("Category slug is invalid.");
  boundedText(category.title, "Category title", 200);
  boundedText(category.tagline, "Category tagline", 500);
  const now = new Date().toISOString();
  const full: Category = {
    ...(existing || {}),
    ...category,
    id,
    name,
    slug: category.slug ?? existing?.slug ?? name.toLowerCase().replace(/\s+/g, "-"),
    title: category.title ?? existing?.title ?? name,
    tagline: category.tagline ?? existing?.tagline ?? "",
    image: category.image ?? existing?.image ?? "",
    sortOrder: category.sortOrder ?? existing?.sortOrder,
    isActive: category.isActive ?? existing?.isActive ?? true,
  };
  await setClientDocument("categories", id, full as unknown as Record<string, unknown>);
  return { success: true, id };
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Category id");
  const category = await readClientDocument<Category>("categories", id);
  if (!category) return { success: false, error: "Category not found" };
  await deleteClientDocument("categories", id);
  return { success: true };
}

export async function getAdminCoupons(): Promise<Coupon[]> {
  return readClientCollection<Coupon>("coupons");
}

export async function saveCoupon(couponData: Partial<Coupon> & { code: string }): Promise<Coupon> {
  if (!couponData || typeof couponData !== "object") throw new Error("Coupon data is required.");
  if (couponData.id) requiredId(couponData.id, "Coupon id");
  if (!/^[A-Z0-9_-]{2,64}$/i.test(couponData.code)) throw new Error("Coupon code is invalid.");
  const id = couponData.id || newId("cpn");
  const existing = couponData.id ? await readClientDocument<Coupon>("coupons", id) : null;
  const now = new Date().toISOString();
  if (couponData.type !== undefined && couponData.type !== "percentage" && couponData.type !== "fixed") throw new Error("Coupon type is invalid.");
  finiteNumber(couponData.value ?? existing?.value ?? 0, "Coupon value");
  finiteNumber(couponData.minOrderValue ?? existing?.minOrderValue ?? 0, "Minimum order value");
  if (couponData.usageLimit !== undefined) integerNumber(couponData.usageLimit, "Coupon usage limit");
  const coupon: Coupon = {
    ...(existing || {}),
    ...couponData,
    id,
    code: couponData.code.toUpperCase(),
    description: couponData.description ?? existing?.description ?? "",
    type: couponData.type ?? existing?.type ?? "percentage",
    value: Number(couponData.value ?? existing?.value ?? 0),
    minOrderValue: Number(couponData.minOrderValue ?? existing?.minOrderValue ?? 0),
    validFrom: couponData.validFrom ?? existing?.validFrom ?? now,
    validUntil: couponData.validUntil ?? existing?.validUntil ?? now,
    usageCount: couponData.usageCount ?? existing?.usageCount ?? 0,
    usageLimit: couponData.usageLimit ?? existing?.usageLimit,
    isActive: couponData.isActive ?? existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? couponData.createdAt ?? now,
  };
  await setClientDocument("coupons", id, coupon as unknown as Record<string, unknown>);
  return coupon;
}

export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
  requiredId(id, "Coupon id");
  const coupon = await readClientDocument<Coupon>("coupons", id);
  if (!coupon) return { success: false, error: "Coupon not found" };
  await deleteClientDocument("coupons", id);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// DATABASE & COLLECTIONS MANAGEMENT (DIRECT CLOUD FIRESTORE)
// ─────────────────────────────────────────────────────────────

const ALL_COLLECTIONS: { name: string; label: string; description: string; isCore: boolean }[] = [
  { name: "products", label: "Products", description: "Apparel catalog items, variants, stock & pricing", isCore: true },
  { name: "categories", label: "Categories", description: "Store departments and navigation categories", isCore: true },
  { name: "orders", label: "Orders", description: "Customer purchases, fulfillment and tracking", isCore: true },
  { name: "users", label: "Users & Customers", description: "Registered customer profiles and account data", isCore: true },
  { name: "coupons", label: "Coupons", description: "Discount codes, promotion rules and usage limits", isCore: true },
  { name: "reviews", label: "Reviews", description: "Customer ratings, feedback and approvals", isCore: false },
  { name: "shipping_providers", label: "Shipping Providers", description: "Shiprocket Automated Express Logistics", isCore: true },
  { name: "shipments", label: "Shipments", description: "Dispatched packages, tracking and AWB numbers", isCore: false },
  { name: "shipping_logs", label: "Shipping Logs", description: "Logistics audit history and delivery milestones", isCore: false },
  { name: "payments", label: "Payments", description: "Transaction logs, payment gateways and receipts", isCore: false },
  { name: "settings", label: "Settings", description: "Store settings, taxes, currency and policies", isCore: true },
  { name: "admin_users", label: "Admin Users", description: "Authorized staff accounts and RBAC bindings", isCore: true },
  { name: "admin_roles", label: "Admin Roles", description: "Permission sets (Super Admin, Catalog, Orders)", isCore: true },
  { name: "admin_logs", label: "Admin Logs", description: "System audit logs and operational history", isCore: false },
];

export async function getDatabaseOverview(): Promise<DatabaseStatus> {
  const collectionPromises = ALL_COLLECTIONS.map(async (c): Promise<CollectionMeta> => {
    try {
      const colRef = collection(db, c.name);
      // Fast fetch with timeout
      const snapPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const snapshot = (await Promise.race([snapPromise, timeoutPromise])) as any;
      const count = snapshot && typeof snapshot.size === "number" ? snapshot.size : 0;
      return {
        name: c.name,
        label: c.label,
        description: c.description,
        count,
        status: count > 0 ? "ready" : "empty",
        isCore: c.isCore,
      };
    } catch {
      return {
        name: c.name,
        label: c.label,
        description: c.description,
        count: 0,
        status: "empty",
        isCore: c.isCore,
      };
    }
  });

  const collectionsMeta = await Promise.all(collectionPromises);
  const totalDocs = collectionsMeta.reduce((sum, item) => sum + item.count, 0);

  return {
    connected: true,
    project: "nxtive-80349",
    source: "Cloud Firestore Client SDK",
    collections: collectionsMeta,
    totalDocuments: totalDocs,
  };
}

export async function initializeFirestoreCollections(): Promise<{
  success: boolean;
  message: string;
  results: Record<string, number>;
}> {
  const now = new Date().toISOString();
  const results: Record<string, number> = {};

  // 1. Categories
  const defaultCategories: Category[] = [
    {
      id: "t-shirts",
      slug: "t-shirts",
      name: "T-Shirts",
      title: "Heavyweight T-Shirts",
      tagline: "Oversized, boxy, and minimal tees in 260-300 GSM organic cotton.",
      image: "/images/nxtvie/cat-tshirts.jpg",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "shirts",
      slug: "shirts",
      name: "Shirts",
      title: "Shirts & Overshirts",
      tagline: "Breathable linen-cotton camp shirts and workwear silhouettes.",
      image: "/images/nxtvie/cat-shirts.jpg",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: "hoodies",
      slug: "hoodies",
      name: "Hoodies",
      title: "Oversized Hoodies",
      tagline: "Heavyweight comfortable oversized hoodies and sweatshirts for Indian winters.",
      image: "/images/nxtvie/cat-hoodies.jpg",
      sortOrder: 3,
      isActive: true,
    },
    {
      id: "bottoms",
      slug: "bottoms",
      name: "Bottoms",
      title: "Pants & Cargos",
      tagline: "Articulated ripstop cargos, wide-leg trousers, and relaxed sweats.",
      image: "/images/nxtvie/cat-bottoms.jpg",
      sortOrder: 4,
      isActive: true,
    },
    {
      id: "jackets",
      slug: "jackets",
      name: "Jackets",
      title: "Technical Jackets",
      tagline: "Weather-resistant urban outerwear engineered for movement.",
      image: "/images/nxtvie/promo-jackets-hd.jpg",
      sortOrder: 5,
      isActive: true,
    },
  ];

  for (const cat of defaultCategories) {
    await setClientDocument("categories", cat.id, cat as any, true);
  }
  results["categories"] = defaultCategories.length;

  // 2. Starter Products
  const starterProducts: Product[] = [
    {
      id: "prod-oversized-tee",
      slug: "heavyweight-oversized-boxy-tee",
      title: "Heavyweight Oversized Boxy Tee",
      price: 1299,
      originalPrice: 1799,
      image: "/images/nxtvie/product-oversized-tee-hd.jpg",
      imageUrl: "/images/nxtvie/product-oversized-tee-hd.jpg",
      images: [
        "/images/nxtvie/product-oversized-tee-hd.jpg",
        "/images/nxtvie/story-back-print-hd.jpg",
      ],
      category: "T-Shirts",
      collections: ["urban-essentials", "new-arrivals"],
      badge: "Bestseller",
      colors: [
        { name: "Washed Black", hex: "#1A1A1A" },
        { name: "Off White", hex: "#F2EFE9" },
        { name: "Olive Earth", hex: "#3D4133" },
      ],
      sizes: ["S", "M", "L", "XL"],
      description: "Crafted from 280 GSM combed organic cotton with dropped shoulders and a boxy silhouette. Pre-shrunk with a ribbed collar that maintains shape wash after wash.",
      details: ["280 GSM 100% Combed Cotton", "Boxy oversized fit", "Seamless drop shoulder", "High-density screenprint on back"],
      fabricCare: ["Machine wash cold inside out", "Do not tumble dry", "Warm iron on reverse", "Dry flat in shade"],
      fit: "Oversized Boxy Fit",
      rating: 4.9,
      reviewCount: 38,
      inStock: true,
      totalStock: 85,
      stock: 85,
      lowStockThreshold: 10,
      featured: true,
      sku: "NXT-TEE-001",
      variants: [
        { sku: "NXT-TEE-S-BLK", size: "S", color: "Washed Black", stock: 15, price: 1299 },
        { sku: "NXT-TEE-M-BLK", size: "M", color: "Washed Black", stock: 25, price: 1299 },
        { sku: "NXT-TEE-L-BLK", size: "L", color: "Washed Black", stock: 25, price: 1299 },
        { sku: "NXT-TEE-XL-BLK", size: "XL", color: "Washed Black", stock: 20, price: 1299 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-oversized-hoodie",
      slug: "oversized-heavyweight-hoodie",
      title: "Heavyweight Oversized Hoodie",
      price: 2499,
      originalPrice: 3299,
      image: "/images/nxtvie/product-core-hoodie-hd.jpg",
      imageUrl: "/images/nxtvie/product-core-hoodie-hd.jpg",
      images: [
        "/images/nxtvie/product-core-hoodie-hd.jpg",
        "/images/nxtvie/gallery-5.jpg",
      ],
      category: "Hoodies",
      collections: ["urban-essentials", "premium-basics"],
      badge: "Trending",
      colors: [
        { name: "Charcoal Ash", hex: "#222224" },
        { name: "Desert Sand", hex: "#D6C7B2" },
      ],
      sizes: ["M", "L", "XL"],
      description: "Heavyweight 400+ GSM cotton fleece pullover hoodie with a double-layered hood, hidden kangaroo pockets, and custom ribbed hems.",
      details: ["Heavyweight 400+ GSM Cotton Fleece", "Double-layered structured hood", "Reinforced cuff ribs", "Minimal chest embroidery"],
      fabricCare: ["Cold machine wash", "Do not bleach", "Dry in shade", "Cool iron if needed"],
      fit: "Relaxed Boxy Draped",
      rating: 4.8,
      reviewCount: 24,
      inStock: true,
      totalStock: 60,
      stock: 60,
      lowStockThreshold: 8,
      featured: true,
      sku: "NXT-HD-002",
      variants: [
        { sku: "NXT-HD-M-CHA", size: "M", color: "Charcoal Ash", stock: 20, price: 2499 },
        { sku: "NXT-HD-L-CHA", size: "L", color: "Charcoal Ash", stock: 20, price: 2499 },
        { sku: "NXT-HD-XL-CHA", size: "XL", color: "Charcoal Ash", stock: 20, price: 2499 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-camp-shirt",
      slug: "camp-collar-structured-shirt",
      title: "Camp Collar Structured Overshirt",
      price: 1899,
      originalPrice: 2499,
      image: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
      imageUrl: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
      images: [
        "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
        "/images/nxtvie/cat-shirts.jpg",
      ],
      category: "Shirts",
      collections: ["new-arrivals"],
      badge: "New",
      colors: [
        { name: "Bone White", hex: "#EAE6DF" },
        { name: "Slate Grey", hex: "#4A5056" },
      ],
      sizes: ["M", "L", "XL"],
      description: "Relaxed resort-collar shirt woven from premium cotton-linen blend. Features custom matte horn buttons and dual chest flap pockets.",
      details: ["60% Cotton, 40% Linen", "Camp cuban open collar", "Twin chest pockets", "Matte horn buttons"],
      fabricCare: ["Hand wash or gentle cycle", "Hang dry", "Steam iron"],
      fit: "Relaxed Straight Fit",
      rating: 4.7,
      reviewCount: 15,
      inStock: true,
      totalStock: 45,
      stock: 45,
      lowStockThreshold: 5,
      featured: true,
      sku: "NXT-SHT-003",
      variants: [
        { sku: "NXT-SHT-M-BON", size: "M", color: "Bone White", stock: 15, price: 1899 },
        { sku: "NXT-SHT-L-BON", size: "L", color: "Bone White", stock: 15, price: 1899 },
        { sku: "NXT-SHT-XL-BON", size: "XL", color: "Bone White", stock: 15, price: 1899 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-ripstop-cargos",
      slug: "articulated-ripstop-cargo-pant",
      title: "Articulated Ripstop Cargo Pants",
      price: 2299,
      originalPrice: 2999,
      image: "/images/nxtvie/product-cargo-pants-hd.jpg",
      imageUrl: "/images/nxtvie/product-cargo-pants-hd.jpg",
      images: [
        "/images/nxtvie/product-cargo-pants-hd.jpg",
        "/images/nxtvie/cat-bottoms.jpg",
      ],
      category: "Bottoms",
      collections: ["urban-essentials"],
      badge: "Bestseller",
      colors: [
        { name: "Tactical Olive", hex: "#3A3D30" },
        { name: "Matte Black", hex: "#161616" },
      ],
      sizes: ["30", "32", "34", "36"],
      description: "Technical articulated cargos in tear-resistant cotton ripstop. Features 6 deep utility pockets, knee darting, and toggle drawcords at hems.",
      details: ["Cotton-nylon high density ripstop", "Knee dart articulation", "Adjustable ankle toggle cords", "YKK zippers"],
      fabricCare: ["Machine wash cold", "Tumble dry low", "Do not iron prints"],
      fit: "Relaxed Tapered with Hem Toggles",
      rating: 4.9,
      reviewCount: 42,
      inStock: true,
      totalStock: 50,
      stock: 50,
      lowStockThreshold: 6,
      featured: true,
      sku: "NXT-PNT-004",
      variants: [
        { sku: "NXT-PNT-30-OLV", size: "30", color: "Tactical Olive", stock: 10, price: 2299 },
        { sku: "NXT-PNT-32-OLV", size: "32", color: "Tactical Olive", stock: 15, price: 2299 },
        { sku: "NXT-PNT-34-OLV", size: "34", color: "Tactical Olive", stock: 15, price: 2299 },
        { sku: "NXT-PNT-36-OLV", size: "36", color: "Tactical Olive", stock: 10, price: 2299 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-tech-jacket",
      slug: "technical-minimal-windbreaker",
      title: "Technical Minimal Windbreaker",
      price: 3499,
      originalPrice: 4499,
      image: "/images/nxtvie/promo-jackets-hd.jpg",
      imageUrl: "/images/nxtvie/promo-jackets-hd.jpg",
      images: [
        "/images/nxtvie/promo-jackets-hd.jpg",
      ],
      category: "Jackets",
      collections: ["new-arrivals"],
      badge: "Trending",
      colors: [
        { name: "Onyx Black", hex: "#111111" },
      ],
      sizes: ["M", "L", "XL"],
      description: "Water-resistant matte shell jacket with two-way waterproof front zipper, concealed storm hood, and breathable underarm vents.",
      details: ["DWR coated windproof nylon", "Waterproof two-way zipper", "Concealed hood", "Elasticized cuffs with velcro adjustment"],
      fabricCare: ["Wipe clean with damp cloth", "Do not dry clean", "Do not iron"],
      fit: "Structured Technical Layering",
      rating: 5.0,
      reviewCount: 19,
      inStock: true,
      totalStock: 30,
      stock: 30,
      lowStockThreshold: 4,
      featured: true,
      sku: "NXT-JKT-005",
      variants: [
        { sku: "NXT-JKT-M-BLK", size: "M", color: "Onyx Black", stock: 10, price: 3499 },
        { sku: "NXT-JKT-L-BLK", size: "L", color: "Onyx Black", stock: 10, price: 3499 },
        { sku: "NXT-JKT-XL-BLK", size: "XL", color: "Onyx Black", stock: 10, price: 3499 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const prod of starterProducts) {
    await setClientDocument("products", prod.id, prod as any, true);
  }
  results["products"] = starterProducts.length;

  // 3. Coupons
  const defaultCoupons: Coupon[] = [
    {
      id: "cpn-welcome10",
      code: "WELCOME10",
      description: "10% off for first-time orders",
      type: "percentage",
      value: 10,
      minOrderValue: 999,
      validFrom: now,
      validUntil: "2028-12-31T23:59:59.000Z",
      usageCount: 0,
      usageLimit: 1000,
      isActive: true,
      createdAt: now,
    },
    {
      id: "cpn-nxtive100",
      code: "NXTIVE100",
      description: "Flat ₹100 off on orders above ₹1499",
      type: "fixed",
      value: 100,
      minOrderValue: 1499,
      validFrom: now,
      validUntil: "2028-12-31T23:59:59.000Z",
      usageCount: 0,
      usageLimit: 500,
      isActive: true,
      createdAt: now,
    },
    {
      id: "cpn-freeship",
      code: "FREESHIP",
      description: "Free shipping voucher",
      type: "fixed",
      value: 99,
      minOrderValue: 999,
      validFrom: now,
      validUntil: "2028-12-31T23:59:59.000Z",
      usageCount: 0,
      usageLimit: 2000,
      isActive: true,
      createdAt: now,
    },
  ];

  for (const cpn of defaultCoupons) {
    await setClientDocument("coupons", cpn.id, cpn as any, true);
  }
  results["coupons"] = defaultCoupons.length;

  // 4. Settings
  const storeSettings = {
    id: "general",
    storeName: "NXTIVE",
    tagline: "Modern Indian Streetwear & Oversized Fits",
    supportEmail: "nxtiveclothing@gmail.com",
    supportPhone: "+91 98765 43210",
    currency: "INR",
    currencySymbol: "₹",
    freeShippingThreshold: 1499,
    defaultShippingFee: 99,
    taxRatePercent: 12,
    primaryAdminEmail: "nxtiveclothing@gmail.com",
    orderIdPrefix: "NXT-",
    inventoryTracking: true,
    lowStockThresholdDefault: 5,
    returnsWindowDays: 7,
    updatedAt: now,
  };
  await setClientDocument("settings", "general", storeSettings, true);
  results["settings"] = 1;

  // 5. Shipping Providers (Shiprocket)
  const shippingProviders = [
    {
      id: "shiprocket",
      name: "Shiprocket",
      slug: "shiprocket",
      code: "shiprocket",
      serviceType: "Automated Express Logistics & Aggregator",
      estimatedDays: "2-4 Days",
      estimatedTransitDays: "2-4 Business Days",
      trackingUrlTemplate: "https://shiprocket.co/tracking/{trackingNumber}",
      isEnabled: true,
      isDefault: true,
      isActive: true,
      createdAt: now,
    },
  ];

  for (const prov of shippingProviders) {
    await setClientDocument("shipping_providers", prov.id, prov, true);
  }
  results["shipping_providers"] = shippingProviders.length;

  // 6. Admin Roles
  const adminRoles = [
    {
      id: "super_admin",
      name: "Super Administrator",
      description: "Full unconstrained administrative rights across all catalog, orders, payments and settings.",
      permissions: [
        "dashboard.view", "products.view", "products.create", "products.edit", "products.delete",
        "orders.view", "orders.edit", "orders.cancel", "customers.view", "customers.edit", "customers.suspend",
        "reviews.view", "reviews.approve", "reviews.reject", "reviews.delete", "payments.view", "payments.manage",
        "shipping.view", "shipping.manage", "categories.view", "categories.edit", "coupons.view", "coupons.manage",
        "admins.view", "admins.manage", "settings.manage"
      ],
      isSystem: true,
      createdAt: now,
    },
    {
      id: "catalog_manager",
      name: "Catalog Manager",
      description: "Manages apparel products, inventory counts, categories and promotional coupons.",
      permissions: [
        "dashboard.view", "products.view", "products.create", "products.edit",
        "categories.view", "categories.edit", "coupons.view", "coupons.manage"
      ],
      isSystem: true,
      createdAt: now,
    },
    {
      id: "order_manager",
      name: "Fulfillment & Orders Lead",
      description: "Manages orders, shipping dispatches, delivery partner status and reviews.",
      permissions: [
        "dashboard.view", "orders.view", "orders.edit", "shipping.view", "shipping.manage",
        "customers.view", "reviews.view", "reviews.approve"
      ],
      isSystem: true,
      createdAt: now,
    },
    {
      id: "support_agent",
      name: "Support Specialist",
      description: "Customer service agent with view permissions for orders and customer queries.",
      permissions: ["dashboard.view", "orders.view", "customers.view", "reviews.view"],
      isSystem: true,
      createdAt: now,
    },
  ];

  for (const role of adminRoles) {
    await setClientDocument("admin_roles", role.id, role, true);
  }
  results["admin_roles"] = adminRoles.length;

  // 7. Primary Admin User
  const primaryAdmin = {
    id: "admin-nxtive",
    email: "nxtiveclothing@gmail.com",
    displayName: "NXTIVE Super Admin",
    role: "super_admin",
    isActive: true,
    accountStatus: "active",
    createdAt: now,
    lastLogin: now,
  };
  await setClientDocument("admin_users", primaryAdmin.id, primaryAdmin, true);
  results["admin_users"] = 1;

  // 8. Admin Log Entry
  const initLog = {
    id: `log-${Date.now()}`,
    action: "DATABASE_INITIALIZED",
    adminEmail: "nxtiveclothing@gmail.com",
    details: "All core Firestore collections successfully seeded and initialized in Cloud Firestore.",
    timestamp: now,
  };
  await setClientDocument("admin_logs", initLog.id, initLog, true);
  results["admin_logs"] = 1;

  return {
    success: true,
    message: "All collections have been initialized and created directly in Cloud Firestore!",
    results,
  };
}

