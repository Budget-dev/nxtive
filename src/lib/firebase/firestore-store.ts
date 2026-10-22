import fs from "fs";
import path from "path";
import { hasAdminCredentials, adminDb } from "./admin";
import { MOCK_PRODUCTS } from "@/constants/mock-products";
import { DEFAULT_CATEGORIES } from "@/lib/catalog";
import type { Product, Category } from "@/types/product";
import type { Customer } from "@/types/user";
import type { Order } from "@/types/order";
import type { Review } from "@/types/review";

const DATA_DIR = path.join(process.cwd(), ".data", "firestore");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getCollectionFilePath(collectionName: string): string {
  ensureDirectoryExists();
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function loadInitialCollectionData(collectionName: string): Record<string, any> {
  const filePath = getCollectionFilePath(collectionName);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  // Pre-populate defaults if file doesn't exist yet
  const initialMap: Record<string, any> = {};

  if (collectionName === "products") {
    MOCK_PRODUCTS.forEach((prod, index) => {
      const now = new Date(Date.now() - index * 86400000).toISOString();
      initialMap[prod.id] = {
        ...prod,
        isActive: true,
        totalStock: (prod as any).totalStock ?? (prod.inStock ? 65 : 0),
        lowStockThreshold: (prod as any).lowStockThreshold ?? 10,
        createdAt: (prod as any).createdAt || now,
        updatedAt: now,
      };
    });
    saveCollectionData(collectionName, initialMap);
  } else if (collectionName === "categories") {
    DEFAULT_CATEGORIES.forEach((cat) => {
      initialMap[cat.id] = {
        ...cat,
        isActive: true,
      };
    });
    saveCollectionData(collectionName, initialMap);
  } else if (collectionName === "users") {
    const sampleCustomers = [
      {
        id: "cust-arjun-01",
        name: "Arjun Mehta",
        displayName: "Arjun Mehta",
        email: "arjun.mehta@example.com",
        phone: "+91 98201 54321",
        city: "Mumbai",
        state: "Maharashtra",
        role: "customer",
        accountStatus: "active",
        isActive: true,
        ordersCount: 4,
        totalSpent: 7896,
        segmentTier: "VIP",
        registrationDate: new Date(Date.now() - 45 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        lastActivity: new Date(Date.now() - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cust-priya-02",
        name: "Priya Sharma",
        displayName: "Priya Sharma",
        email: "priya.sharma@example.com",
        phone: "+91 98110 98765",
        city: "Delhi",
        state: "Delhi",
        role: "customer",
        accountStatus: "active",
        isActive: true,
        ordersCount: 2,
        totalSpent: 3998,
        segmentTier: "Regular",
        registrationDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastActivity: new Date(Date.now() - 5 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cust-rohan-03",
        name: "Rohan Verma",
        displayName: "Rohan Verma",
        email: "rohan.verma@example.com",
        phone: "+91 97401 23456",
        city: "Bengaluru",
        state: "Karnataka",
        role: "customer",
        accountStatus: "active",
        isActive: true,
        ordersCount: 3,
        totalSpent: 6290,
        segmentTier: "VIP",
        registrationDate: new Date(Date.now() - 20 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        lastActivity: new Date(Date.now() - 1 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cust-ananya-04",
        name: "Ananya Roy",
        displayName: "Ananya Roy",
        email: "ananya.roy@example.com",
        phone: "+91 99030 11223",
        city: "Kolkata",
        state: "West Bengal",
        role: "customer",
        accountStatus: "active",
        isActive: true,
        ordersCount: 1,
        totalSpent: 1899,
        segmentTier: "New",
        registrationDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        lastActivity: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleCustomers.forEach((c) => {
      initialMap[c.id] = c;
    });
    saveCollectionData(collectionName, initialMap);
  } else if (collectionName === "orders") {
    const sampleOrders = [
      {
        id: "ord-1001",
        orderNumber: "NX-2026-9812",
        userId: "cust-arjun-01",
        items: [
          {
            productId: "nxtive-boxy-tee-01",
            title: "Oversized Heavyweight Boxy Tee",
            sku: "NV-TS-001",
            price: 1899,
            quantity: 1,
            selectedSize: "L",
            selectedColor: "Pitch Black",
            image: "/images/nxtvie/product-oversized-tee-hd.jpg",
          },
        ],
        subtotal: 1899,
        discount: 0,
        shipping: 0,
        total: 1899,
        status: "delivered",
        paymentMethod: "Razorpay (UPI)",
        paymentStatus: "paid",
        shippingAddress: {
          fullName: "Arjun Mehta",
          email: "arjun.mehta@example.com",
          phone: "+91 98201 54321",
          street: "14 Altamount Road",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400026",
          country: "India",
        },
        deliveryMethod: "BlueDart Express",
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: "ord-1002",
        orderNumber: "NX-2026-9813",
        userId: "cust-priya-02",
        items: [
          {
            productId: "nxtive-hoodie-02",
            title: "French Terry Architectural Hoodie",
            sku: "NV-HD-002",
            price: 3499,
            quantity: 1,
            selectedSize: "M",
            selectedColor: "Bone White",
            image: "/images/nxtvie/gallery-1.jpg",
          },
        ],
        subtotal: 3499,
        discount: 200,
        shipping: 0,
        total: 3299,
        status: "shipped",
        paymentMethod: "Razorpay (Credit Card)",
        paymentStatus: "paid",
        shippingAddress: {
          fullName: "Priya Sharma",
          email: "priya.sharma@example.com",
          phone: "+91 98110 98765",
          street: "B-42 Vasant Vihar",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110057",
          country: "India",
        },
        deliveryMethod: "Delhivery Surface",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "ord-1003",
        orderNumber: "NX-2026-9814",
        userId: "cust-rohan-03",
        items: [
          {
            productId: "nxtive-cargo-03",
            title: "Relaxed Fit Pleated Chino",
            sku: "NV-BT-003",
            price: 2799,
            quantity: 1,
            selectedSize: "32",
            selectedColor: "Washed Olive",
            image: "/images/nxtvie/gallery-2.jpg",
          },
        ],
        subtotal: 2799,
        discount: 0,
        shipping: 100,
        total: 2899,
        status: "pending",
        paymentMethod: "Cash on Delivery",
        paymentStatus: "pending",
        shippingAddress: {
          fullName: "Rohan Verma",
          email: "rohan.verma@example.com",
          phone: "+91 97401 23456",
          street: "88 Indiranagar 100ft Road",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560038",
          country: "India",
        },
        deliveryMethod: "Standard Courier",
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
    ];

    sampleOrders.forEach((o) => {
      initialMap[o.id] = o;
    });
    saveCollectionData(collectionName, initialMap);
  } else if (collectionName === "reviews") {
    const sampleReviews = [
      {
        id: "rev-201",
        productId: "nxtive-boxy-tee-01",
        userId: "cust-arjun-01",
        userName: "Arjun Mehta",
        userAvatar: "/images/nxtvie/gallery-1.jpg",
        rating: 5,
        comment: "The drape and weight on this tee is exceptional. Feels like high-end luxury streetwear.",
        status: "pending",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: "rev-202",
        productId: "nxtive-hoodie-02",
        userId: "cust-priya-02",
        userName: "Priya Sharma",
        userAvatar: "/images/nxtvie/gallery-3.jpg",
        rating: 5,
        comment: "Heavyweight French terry with the perfect boxy silhouette. Highly recommend!",
        status: "pending",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    sampleReviews.forEach((r) => {
      initialMap[r.id] = r;
    });
    saveCollectionData(collectionName, initialMap);
  }

  return initialMap;
}

function saveCollectionData(collectionName: string, data: Record<string, any>) {
  ensureDirectoryExists();
  const filePath = getCollectionFilePath(collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function storeReadCollection<T>(collectionName: string): Promise<T[]> {
  // If service account is available, try adminDb first
  if (hasAdminCredentials) {
    try {
      const snapshot = await adminDb.collection(collectionName).get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
      }
    } catch (err) {
      console.warn(`[firestore-store] adminDb read error for ${collectionName}:`, err);
    }
  }

  // Load from persistent storage
  const map = loadInitialCollectionData(collectionName);
  return Object.values(map) as T[];
}

export async function storeReadDocument<T>(collectionName: string, id: string): Promise<T | null> {
  if (hasAdminCredentials) {
    try {
      const doc = await adminDb.collection(collectionName).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as T;
      }
    } catch (err) {
      console.warn(`[firestore-store] adminDb read doc error for ${collectionName}/${id}:`, err);
    }
  }

  const map = loadInitialCollectionData(collectionName);
  return (map[id] as T) || null;
}

export async function storeSetDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: T,
  merge = true
): Promise<void> {
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).set(data, { merge });
    } catch (err) {
      console.warn(`[firestore-store] adminDb set error for ${collectionName}/${id}:`, err);
    }
  }

  const map = loadInitialCollectionData(collectionName);
  const existing = map[id] || {};
  map[id] = merge ? { ...existing, ...data, id } : { ...data, id };
  saveCollectionData(collectionName, map);
}

export async function storeUpdateDocument(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).update(data);
    } catch (err) {
      console.warn(`[firestore-store] adminDb update error for ${collectionName}/${id}:`, err);
    }
  }

  const map = loadInitialCollectionData(collectionName);
  if (map[id]) {
    map[id] = { ...map[id], ...data, id, updatedAt: new Date().toISOString() };
    saveCollectionData(collectionName, map);
  }
}

export async function storeDeleteDocument(collectionName: string, id: string): Promise<void> {
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).delete();
    } catch (err) {
      console.warn(`[firestore-store] adminDb delete error for ${collectionName}/${id}:`, err);
    }
  }

  const map = loadInitialCollectionData(collectionName);
  if (map[id]) {
    delete map[id];
    saveCollectionData(collectionName, map);
  }
}
