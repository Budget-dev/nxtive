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

export async function fetchStorefrontProducts(): Promise<Product[]> {
  try {
    return await readActiveDocuments("products", normalizeProduct);
  } catch {
    return [];
  }
}

export async function fetchStorefrontCategories(): Promise<Category[]> {
  try {
    const categories = await readActiveDocuments("categories", normalizeCategory);
    return categories.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  } catch {
    return [];
  }
}

export function categoriesFromProducts(products: Product[]): Category[] {
  const seen = new Map<string, Category>();
  for (const product of products) {
    const slug = product.category.toLowerCase().replace(/\s+/g, "-");
    if (seen.has(slug)) continue;
    seen.set(slug, {
      id: slug,
      slug,
      name: product.category,
      title: product.category,
      tagline: "",
      image: product.image,
      isActive: true,
    });
  }
  return Array.from(seen.values());
}

export function productsForCategory(products: Product[], slug: string): Product[] {
  const normalized = slug.toLowerCase();
  if (normalized === "all" || normalized === "shop") return products;
  return products.filter((product) => {
    const category = product.category.toLowerCase();
    return (
      category === normalized ||
      category.replace(/\s+/g, "-") === normalized ||
      product.collections.includes(normalized)
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
