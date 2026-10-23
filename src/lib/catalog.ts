import { collection, getDocs, query, where } from "firebase/firestore";
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
  const name = String(value || "");
  return CATEGORIES.includes(name as ProductCategory) ? (name as ProductCategory) : "T-Shirts";
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
  const image = String(data.image || "");
  const images = asStringList(data.images);
  return {
    id,
    slug: String(data.slug || id),
    title,
    price: Number(data.price || 0),
    originalPrice: data.originalPrice == null || data.originalPrice === "" ? null : Number(data.originalPrice),
    image,
    images: images.length ? images : image ? [image] : [],
    category: asCategoryName(data.category),
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
  const col = collection(db, collectionName);
  const filtered = await getDocs(query(col, where("isActive", "==", true)));
  const filteredDocs = filtered.docs as CatalogDoc[];
  let rows = filteredDocs
    .map((docSnap) => normalize(docSnap.id, docSnap.data()))
    .filter((row): row is T => row !== null);

  if (rows.length > 0) return rows;

  try {
    const all = await getDocs(col);
    const allDocs = all.docs as CatalogDoc[];
    rows = allDocs
      .map((docSnap) => normalize(docSnap.id, docSnap.data()))
      .filter((row): row is T => row !== null);
  } catch {
    return [];
  }
  return rows;
}

export const DEFAULT_CATEGORIES: Category[] = [
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
    title: "French Terry Hoodies",
    tagline: "Substantial 450 GSM hoodies and pullovers with architectural drape.",
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
  {
    id: "accessories",
    slug: "accessories",
    name: "Accessories",
    title: "Accessories",
    tagline: "Structured dad caps, canvas bags, and elevated essentials.",
    image: "/images/nxtvie/cat-accessories.jpg",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "men",
    slug: "men",
    name: "Men",
    title: "Men's Collection",
    tagline: "Modern menswear inspired by Asian style and everyday comfort.",
    image: "/images/nxtvie/hero-model.jpg",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "new-arrivals",
    slug: "new-arrivals",
    name: "New Arrivals",
    title: "New Releases",
    tagline: "Fresh silhouettes, limited drops, and seasonal colorways.",
    image: "/images/nxtvie/banner-urban-essentials-hd.jpg",
    sortOrder: 8,
    isActive: true,
  },
  {
    id: "clothing",
    slug: "clothing",
    name: "Clothing",
    title: "Apparel Collection",
    tagline: "Heavyweight tees, structured shirts, technical outerwear and pants.",
    image: "/images/nxtvie/promo-jackets-hd.jpg",
    sortOrder: 9,
    isActive: true,
  },
  {
    id: "collections",
    slug: "collections",
    name: "Collections",
    title: "Curated Collections",
    tagline: "Explore Urban Essentials, Premium Basics, and Mindset Capsules.",
    image: "/images/nxtvie/banner-premium-basics-stack-hd.jpg",
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "sale",
    slug: "sale",
    name: "Sale",
    title: "Archive Sale",
    tagline: "Past season favorites and limited-run items at special prices.",
    image: "/images/nxtvie/promo-asian-minimal-hd.jpg",
    sortOrder: 11,
    isActive: true,
  },
  {
    id: "urban-essentials",
    slug: "urban-essentials",
    name: "Urban Essentials",
    title: "Urban Essentials Collection",
    tagline: "Everyday boxy silhouettes and modern earth tones.",
    image: "/images/nxtvie/banner-urban-essentials-hd.jpg",
    sortOrder: 12,
    isActive: true,
  },
  {
    id: "premium-basics",
    slug: "premium-basics",
    name: "Premium Basics",
    title: "Premium Basics",
    tagline: "Heavyweight organic cotton staples made to last.",
    image: "/images/nxtvie/banner-luxury-basics.jpg",
    sortOrder: 13,
    isActive: true,
  },
];

const FALLBACK_PRODUCTS: Product[] = [];

export async function fetchStorefrontProducts(): Promise<Product[]> {
  try {
    const products = await readActiveDocuments("products", normalizeProduct);
    if (products.length > 0) return products;
  } catch {
    // Continue to API check
  }

  try {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // Fall back to FALLBACK_PRODUCTS
  }

  return FALLBACK_PRODUCTS;
}

export async function fetchStorefrontCategories(): Promise<Category[]> {
  try {
    const categories = await readActiveDocuments("categories", normalizeCategory);
    if (categories.length > 0) {
      return categories.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    }
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function categoriesFromProducts(products: Product[]): Category[] {
  const seen = new Map<string, Category>();
  for (const product of products) {
    const slug = product.category.toLowerCase().replace(/\s+/g, "-");
    if (seen.has(slug)) continue;
    const defaultMeta = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
    seen.set(slug, {
      id: slug,
      slug,
      name: defaultMeta?.name || product.category,
      title: defaultMeta?.title || product.category,
      tagline: defaultMeta?.tagline || "",
      image: defaultMeta?.image || product.image,
      sortOrder: defaultMeta?.sortOrder ?? 999,
      isActive: true,
    });
  }
  const derived = Array.from(seen.values()).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  return derived.length > 0 ? derived : DEFAULT_CATEGORIES;
}

export function productsForCategory(products: Product[], slug: string): Product[] {
  const normalized = slug.toLowerCase();
  if (normalized === "all" || normalized === "shop") return products;
  return products.filter((product) => {
    const category = product.category.toLowerCase();
    return (
      category === normalized ||
      category.replace(/\s+/g, "-") === normalized ||
      product.collections.includes(normalized) ||
      (normalized === "sale" && (product.badge === "Sale" || (product.originalPrice != null && product.originalPrice > product.price))) ||
      (normalized === "new-arrivals" && (product.badge === "New" || product.collections.includes("new-arrivals"))) ||
      (normalized === "clothing" && category !== "accessories")
    );
  });
}

export function relatedProducts(products: Product[], productId: string, limit = 4): Product[] {
  const current = products.find((product) => product.id === productId);
  if (!current) return products.slice(0, limit);
  return products
    .filter((product) => product.id !== productId && product.category === current.category)
    .concat(products.filter((product) => product.id !== productId && product.category !== current.category))
    .slice(0, limit);
}
