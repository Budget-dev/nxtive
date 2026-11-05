import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Category, Product, ProductBadge, ProductCategory } from "@/types/product";

const CATEGORIES: ProductCategory[] = [
  "T-Shirts",
  "Shirts",
  "Hoodies",
  "Bottoms",
  "Accessories",
  "Jackets",
];

function asCategoryName(value: unknown): ProductCategory {
  const name = String(value || "").trim();
  if (!name) return "T-Shirts";
  const matched = CATEGORIES.find((c) => c.toLowerCase() === name.toLowerCase());
  return matched || (name as ProductCategory);
}

function asBadge(value: unknown): ProductBadge | null {
  if (value === "Bestseller" || value === "New" || value === "Trending" || value === "Sale") return value;
  return null;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function normalizeProduct(id: string, data: Record<string, unknown>): Product | null {
  if (data.isActive === false) return null;
  const title = String(data.title || "").trim();
  if (!title) return null;
  const image = String(data.image || data.imageUrl || "");
  const images = asStringList(data.images);
  const categoryRaw = String(data.category || "").trim();
  const category = asCategoryName(categoryRaw);
  const categoryIdRaw =
    typeof data.categoryId === "string" && data.categoryId.trim()
      ? data.categoryId.trim().toLowerCase()
      : category.toLowerCase().replace(/\s+/g, "-");

  return {
    id,
    slug: String(data.slug || id),
    title,
    price: Number(data.price || 0),
    originalPrice: data.originalPrice == null || data.originalPrice === "" ? null : Number(data.originalPrice),
    image,
    images: images.length ? images : image ? [image] : [],
    category,
    categoryId: categoryIdRaw,
    collections: asStringList(data.collections),
    badge: asBadge(data.badge),
    colors: Array.isArray(data.colors)
      ? data.colors
          .filter((color) => color && typeof color === "object")
          .map((color) => ({
            name: String((color as { name?: unknown }).name || ""),
            hex: String((color as { hex?: unknown }).hex || "#181818"),
          }))
      : [],
    sizes: asStringList(data.sizes),
    description: String(data.description || ""),
    details: asStringList(data.details),
    fabricCare: asStringList(data.fabricCare),
    fit: String(data.fit || ""),
    rating: Number(data.rating || 0),
    reviewCount: Number(data.reviewCount || 0),
    inStock: data.inStock !== false,
    featured: Boolean(data.featured),
    sku: data.sku ? String(data.sku) : undefined,
    isActive: true,
  };
}

export function normalizeCategory(id: string, data: Record<string, unknown>): Category | null {
  if (data.isActive === false) return null;
  const name = String(data.name || "").trim();
  if (!name) return null;
  return {
    id,
    slug: String(data.slug || name.toLowerCase().replace(/\s+/g, "-")),
    name,
    title: String(data.title || name),
    tagline: String(data.tagline || ""),
    image: String(data.image || ""),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : undefined,
    isActive: true,
  };
}

type CatalogDoc = { id: string; data: () => Record<string, unknown> };

async function readActiveDocuments<T>(
  collectionName: string,
  normalize: (id: string, data: Record<string, unknown>) => T | null
): Promise<T[]> {
  try {
    const col = collection(db, collectionName);
    const snapshot = await getDocs(col);
    const docs = snapshot.docs as CatalogDoc[];
    return docs
      .map((docSnap) => normalize(docSnap.id, docSnap.data()))
      .filter((row): row is T => row !== null);
  } catch {
    return [];
  }
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "t-shirts",
    slug: "t-shirts",
    name: "T-Shirts",
    title: "Oversized T-Shirts",
    tagline: "Heavyweight drop-shoulder and boxy oversized tees in pure 260-300 GSM cotton.",
    image: "/images/nxtvie/cat-tshirts.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "shirts",
    slug: "shirts",
    name: "Shirts",
    title: "Casual & Oversized Shirts",
    tagline: "Relaxed cotton shirts and casual overshirts perfect for daily wear.",
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
    title: "Cargo Pants & Trousers",
    tagline: "Comfortable wide-leg cargos, parachute pants, and relaxed joggers.",
    image: "/images/nxtvie/cat-bottoms.jpg",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "jackets",
    slug: "jackets",
    name: "Jackets",
    title: "Jackets & Layering",
    tagline: "Streetwear jackets, bombers, and windcheaters for cool evenings.",
    image: "/images/nxtvie/promo-jackets-hd.jpg",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "accessories",
    slug: "accessories",
    name: "Accessories",
    title: "Caps & Accessories",
    tagline: "Everyday street caps, canvas tote bags, and lifestyle accessories.",
    image: "/images/nxtvie/cat-accessories.jpg",
    sortOrder: 6,
    isActive: true,
  },
];

// ZERO mock products - true empty state until items are created in Firestore/admin
export const FALLBACK_PRODUCTS: Product[] = [];

// High-speed catalog cache to boost page transitions & eliminate redundant queries
let storefrontProductsCache: { timestamp: number; data: Product[] } | null = null;
let storefrontCategoriesCache: { timestamp: number; data: Category[] } | null = null;
const CATALOG_CACHE_TTL_MS = 4_000;

export function invalidateCatalogCache() {
  storefrontProductsCache = null;
  storefrontCategoriesCache = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("nxtive_cache_products");
      sessionStorage.removeItem("nxtive_cache_products_time");
      sessionStorage.removeItem("nxtive_cache_categories");
      sessionStorage.removeItem("nxtive_cache_categories_time");
      window.dispatchEvent(new CustomEvent("nxtive:catalog-invalidated"));
    } catch {}
  }
}

export async function fetchStorefrontProducts(): Promise<Product[]> {
  const now = Date.now();
  if (storefrontProductsCache && now - storefrontProductsCache.timestamp < CATALOG_CACHE_TTL_MS) {
    return storefrontProductsCache.data;
  }

  // 1. Try reading client sessionStorage in browser for instant responses
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("nxtive_cache_products");
      const storedTime = Number(sessionStorage.getItem("nxtive_cache_products_time") || 0);
      if (stored && now - storedTime < CATALOG_CACHE_TTL_MS) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          storefrontProductsCache = { timestamp: now, data: parsed };
          return parsed;
        }
      }
    } catch {}
  }

  // 2. Try fetching from server API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          storefrontProductsCache = { timestamp: now, data: json.products };
          try {
            sessionStorage.setItem("nxtive_cache_products", JSON.stringify(json.products));
            sessionStorage.setItem("nxtive_cache_products_time", String(now));
          } catch {}
          return json.products;
        }
      }
    } catch {}
  }

  // 3. Fallback to direct active documents read
  try {
    const products = await readActiveDocuments("products", normalizeProduct);
    storefrontProductsCache = { timestamp: now, data: products };
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("nxtive_cache_products", JSON.stringify(products));
        sessionStorage.setItem("nxtive_cache_products_time", String(now));
      } catch {}
    }
    return products;
  } catch {
    return storefrontProductsCache?.data ?? [];
  }
}

export async function fetchStorefrontCategories(): Promise<Category[]> {
  const now = Date.now();
  if (storefrontCategoriesCache && now - storefrontCategoriesCache.timestamp < CATALOG_CACHE_TTL_MS) {
    return storefrontCategoriesCache.data;
  }

  // 1. Try reading client sessionStorage
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("nxtive_cache_categories");
      const storedTime = Number(sessionStorage.getItem("nxtive_cache_categories_time") || 0);
      if (stored && now - storedTime < CATALOG_CACHE_TTL_MS) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          storefrontCategoriesCache = { timestamp: now, data: parsed };
          return parsed;
        }
      }
    } catch {}
  }

  // 2. Try fetching from fast server API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.categories) && json.categories.length > 0) {
          storefrontCategoriesCache = { timestamp: now, data: json.categories };
          try {
            sessionStorage.setItem("nxtive_cache_categories", JSON.stringify(json.categories));
            sessionStorage.setItem("nxtive_cache_categories_time", String(now));
          } catch {}
          return json.categories;
        }
      }
    } catch {}
  }

  // 3. Fallback to direct active documents read
  try {
    const remote = await readActiveDocuments("categories", normalizeCategory);
    const sorted =
      remote.length > 0
        ? remote.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        : DEFAULT_CATEGORIES;
    storefrontCategoriesCache = { timestamp: now, data: sorted };
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("nxtive_cache_categories", JSON.stringify(sorted));
        sessionStorage.setItem("nxtive_cache_categories_time", String(now));
      } catch {}
    }
    return sorted;
  } catch {
    return storefrontCategoriesCache?.data ?? DEFAULT_CATEGORIES;
  }
}

export function categoriesFromProducts(products: Product[]): Category[] {
  if (!Array.isArray(products) || products.length === 0) return DEFAULT_CATEGORIES;
  const seen = new Map<string, Category>();
  for (const product of products) {
    if (!product || !product.category) continue;
    const catName = String(product.category);
    const slug = catName.toLowerCase().replace(/\s+/g, "-");
    if (seen.has(slug)) continue;
    const defaultMeta = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
    seen.set(slug, {
      id: slug,
      slug,
      name: defaultMeta?.name || catName,
      title: defaultMeta?.title || catName,
      tagline: defaultMeta?.tagline || "",
      image: defaultMeta?.image || product.image || "/images/nxtvie/cat-tshirts.jpg",
      sortOrder: defaultMeta?.sortOrder ?? 999,
      isActive: true,
    });
  }
  const derived = Array.from(seen.values()).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  return derived.length > 0 ? derived : DEFAULT_CATEGORIES;
}

export function productsForCategory(products: Product[], slug: string): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];
  const normalized = String(slug || "").toLowerCase().trim();

  // All / Shop / Collections
  if (normalized === "all" || normalized === "shop" || normalized === "collections") {
    return products;
  }

  // Men / Menswear: NXTIVE is a contemporary menswear brand, so Men includes all apparel
  if (normalized === "men" || normalized === "menswear") {
    return products.filter((p) => String(p?.category || "").toLowerCase() !== "accessories");
  }

  // Clothing: All non-accessory garments
  if (normalized === "clothing") {
    return products.filter((p) => String(p?.category || "").toLowerCase() !== "accessories");
  }

  // Sale drops
  if (normalized === "sale") {
    return products.filter(
      (p) =>
        p?.badge === "Sale" ||
        (p?.originalPrice != null && p.originalPrice > p.price) ||
        (Array.isArray(p?.collections) && p.collections.some((c) => String(c).toLowerCase().trim() === "sale"))
    );
  }

  // New arrivals
  if (normalized === "new-arrivals" || normalized === "new") {
    return products.filter(
      (p) =>
        p?.badge === "New" ||
        (Array.isArray(p?.collections) &&
          p.collections.some((c) => {
            const cl = String(c).toLowerCase().trim();
            return cl === "new-arrivals" || cl === "new";
          }))
    );
  }

  // Standard category / collection matching (checks category, categorySlug, categoryId, categoryIdSlug, and collections)
  return products.filter((product) => {
    if (!product) return false;
    const cat = String(product.category || "").toLowerCase().trim();
    const catSlug = cat.replace(/\s+/g, "-");
    const catId = String(product.categoryId || "").toLowerCase().trim();
    const catIdSlug = catId.replace(/\s+/g, "-");
    const collections = Array.isArray(product.collections)
      ? product.collections.map((c) => String(c || "").toLowerCase().trim())
      : [];

    return (
      cat === normalized ||
      catSlug === normalized ||
      catId === normalized ||
      catIdSlug === normalized ||
      collections.includes(normalized) ||
      collections.some((c) => c.replace(/\s+/g, "-") === normalized)
    );
  });
}

export function relatedProducts(products: Product[], productId: string, limit = 4): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];
  const current = products.find((product) => product && product.id === productId);
  if (!current) return products.slice(0, limit);
  return products
    .filter((product) => product && product.id !== productId && product.category === current.category)
    .concat(products.filter((product) => product && product.id !== productId && product.category !== current.category))
    .slice(0, limit);
}
