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

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "prod-oversized-tee",
    title: "Oversized Heavyweight Boxy Tee",
    slug: "oversized-heavyweight-boxy-tee",
    description: "Crafted from custom 280 GSM combed organic cotton. Features architectural draping, drop-shoulder silhouette, and reinforced ribbed collar.",
    imageUrl: "/images/nxtvie/product-oversized-tee-hd.jpg",
    image: "/images/nxtvie/product-oversized-tee-hd.jpg",
    images: ["/images/nxtvie/product-oversized-tee-hd.jpg", "/images/nxtvie/gallery-1.jpg"],
    category: "T-Shirts",
    collections: ["men", "clothing", "urban-essentials", "premium-basics"],
    price: 1299,
    originalPrice: 1799,
    stock: 85,
    totalStock: 85,
    lowStockThreshold: 10,
    inStock: true,
    featured: true,
    badge: "Bestseller",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Pitch Black", hex: "#121212" },
      { name: "Bone White", hex: "#EAE6DF" },
    ],
    details: ["280 GSM 100% Combed Cotton", "Preshrunk fabric", "High-density ribbed crewneck"],
    fabricCare: ["Machine wash cold inside out", "Tumble dry low", "Do not iron print"],
    fit: "Oversized Boxy Fit",
    rating: 4.9,
    reviewCount: 42,
    isActive: true,
  },
  {
    id: "prod-minimal-logo-tee",
    title: "Minimalist Raw Edge Heavyweight Tee",
    slug: "minimalist-raw-edge-heavyweight-tee",
    description: "300 GSM ultra-heavy organic jersey tee with subtle tonal branding at back neck and clean straight hem.",
    imageUrl: "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
    image: "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
    images: ["/images/nxtvie/product-minimal-logo-tee-hd.jpg", "/images/nxtvie/gallery-6.jpg"],
    category: "T-Shirts",
    collections: ["men", "clothing", "urban-essentials", "new-arrivals"],
    price: 1199,
    originalPrice: 1599,
    stock: 60,
    totalStock: 60,
    lowStockThreshold: 8,
    inStock: true,
    featured: true,
    badge: "New",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal Grey", hex: "#2B2D2F" },
      { name: "Natural Cream", hex: "#E5E0D5" },
    ],
    details: ["300 GSM Heavyweight Jersey", "Blind hem stitch", "Tonal silicone micro-logo"],
    fabricCare: ["Machine wash cold", "Dry flat"],
    fit: "Relaxed Fit",
    rating: 4.8,
    reviewCount: 28,
    isActive: true,
  },
  {
    id: "prod-relaxed-fit-shirt",
    title: "Linen-Cotton Relaxed Resort Shirt",
    slug: "linen-cotton-relaxed-resort-shirt",
    description: "Relaxed open-collar shirt tailored from breathable linen-cotton blend. Features dropped shoulder seam and natural horn buttons.",
    imageUrl: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
    image: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
    images: ["/images/nxtvie/product-relaxed-fit-shirt-hd.jpg", "/images/nxtvie/cat-shirts.jpg"],
    category: "Shirts",
    collections: ["men", "clothing", "urban-essentials"],
    price: 1899,
    originalPrice: 2399,
    stock: 45,
    totalStock: 45,
    lowStockThreshold: 6,
    inStock: true,
    featured: true,
    badge: "Trending",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sage Olive", hex: "#5C654E" },
      { name: "Sand Dune", hex: "#D8CBB7" },
    ],
    details: ["55% Linen, 45% Cotton", "Camp collar silhouette", "Straight cut split hem"],
    fabricCare: ["Gentle hand wash", "Line dry in shade"],
    fit: "Relaxed Camp Fit",
    rating: 4.9,
    reviewCount: 19,
    isActive: true,
  },
  {
    id: "prod-camp-collar-shirt",
    title: "Structured Utility Camp Collar Shirt",
    slug: "structured-utility-camp-collar-shirt",
    description: "Crisp structured cotton overshirt with dual front patch pockets and modern squared cuffs.",
    imageUrl: "/images/nxtvie/cat-shirts.jpg",
    image: "/images/nxtvie/cat-shirts.jpg",
    images: ["/images/nxtvie/cat-shirts.jpg"],
    category: "Shirts",
    collections: ["men", "clothing", "premium-basics", "sale"],
    price: 1799,
    originalPrice: 2499,
    stock: 35,
    totalStock: 35,
    lowStockThreshold: 5,
    inStock: true,
    featured: false,
    badge: "Sale",
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "Midnight Navy", hex: "#1C2430" },
      { name: "Raw Khaki", hex: "#8C8270" },
    ],
    details: ["100% Crisp Cotton Twill", "Dual chest utility pockets"],
    fabricCare: ["Machine wash cold", "Warm iron"],
    fit: "Structured Regular Fit",
    rating: 4.7,
    reviewCount: 15,
    isActive: true,
  },
  {
    id: "prod-french-terry-hoodie",
    title: "French Terry Relaxed Hoodie",
    slug: "french-terry-relaxed-hoodie",
    description: "Substantial 450 GSM custom French terry knit with double-lined structured hood and raw kangaroo pocket styling.",
    imageUrl: "/images/nxtvie/cat-hoodies.jpg",
    image: "/images/nxtvie/cat-hoodies.jpg",
    images: ["/images/nxtvie/cat-hoodies.jpg", "/images/nxtvie/gallery-2.jpg"],
    category: "Hoodies",
    collections: ["men", "clothing", "urban-essentials", "new-arrivals"],
    price: 2899,
    originalPrice: 3499,
    stock: 40,
    totalStock: 40,
    lowStockThreshold: 8,
    inStock: true,
    featured: true,
    badge: "Bestseller",
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "Concrete Grey", hex: "#8A8D8F" },
      { name: "Pitch Black", hex: "#121212" },
    ],
    details: ["450 GSM 100% French Terry", "Seamless kangaroo pouch", "Double-layered self-fabric hood"],
    fabricCare: ["Machine wash cold", "Tumble dry low"],
    fit: "Relaxed Street Fit",
    rating: 4.9,
    reviewCount: 51,
    isActive: true,
  },
  {
    id: "prod-core-hoodie",
    title: "Core Architectural Heavyweight Hoodie",
    slug: "core-architectural-heavyweight-hoodie",
    description: "Sculptural heavyweight hoodie engineered with double darted shoulders and heavyweight ribbed waist for zero ride-up.",
    imageUrl: "/images/nxtvie/product-core-hoodie-hd.jpg",
    image: "/images/nxtvie/product-core-hoodie-hd.jpg",
    images: ["/images/nxtvie/product-core-hoodie-hd.jpg", "/images/nxtvie/gallery-5.jpg"],
    category: "Hoodies",
    collections: ["men", "clothing", "urban-essentials"],
    price: 2999,
    originalPrice: 3699,
    stock: 50,
    totalStock: 50,
    lowStockThreshold: 10,
    inStock: true,
    featured: true,
    badge: "New",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Washed Onyx", hex: "#1A1918" },
      { name: "Slate Sand", hex: "#736D64" },
    ],
    details: ["500 GSM Brushed Loopback Fleece", "Raglan gusset sleeves"],
    fabricCare: ["Hand wash cold"],
    fit: "Architectural Oversized",
    rating: 4.9,
    reviewCount: 34,
    isActive: true,
  },
  {
    id: "prod-ripstop-cargo-pant",
    title: "Articulated Ripstop Cargo Pants",
    slug: "articulated-ripstop-cargo-pant",
    description: "Durable cotton-nylon ripstop construction with 3D pleated cargo pockets, darted knee articulation, and adjustable cuff toggles.",
    imageUrl: "/images/nxtvie/cat-bottoms.jpg",
    image: "/images/nxtvie/cat-bottoms.jpg",
    images: ["/images/nxtvie/cat-bottoms.jpg", "/images/nxtvie/gallery-4.jpg"],
    category: "Bottoms",
    collections: ["men", "clothing", "urban-essentials"],
    price: 2499,
    originalPrice: 2999,
    stock: 30,
    totalStock: 30,
    lowStockThreshold: 5,
    inStock: true,
    featured: true,
    badge: "Trending",
    sizes: ["30", "32", "34", "36"],
    colors: [
      { name: "Army Green", hex: "#4B5320" },
      { name: "Shadow Charcoal", hex: "#2B2D2F" },
    ],
    details: ["70% Cotton, 30% Nylon Ripstop", "6 ergonomic utility pockets", "Bungee ankle drawcord"],
    fabricCare: ["Machine wash cold", "Tumble dry low"],
    fit: "Articulated Relaxed",
    rating: 4.8,
    reviewCount: 38,
    isActive: true,
  },
  {
    id: "prod-relaxed-cargo-pants",
    title: "Heavyweight Utility Cargo Pants",
    slug: "heavyweight-utility-cargo-pants",
    description: "Straight-leg utility trousers with clean slanted welt pockets and deep gusseted leg compartments.",
    imageUrl: "/images/nxtvie/product-cargo-pants-hd.jpg",
    image: "/images/nxtvie/product-cargo-pants-hd.jpg",
    images: ["/images/nxtvie/product-cargo-pants-hd.jpg"],
    category: "Bottoms",
    collections: ["men", "clothing", "premium-basics"],
    price: 2599,
    originalPrice: 3199,
    stock: 42,
    totalStock: 42,
    lowStockThreshold: 7,
    inStock: true,
    featured: false,
    badge: "Bestseller",
    sizes: ["30", "32", "34", "36"],
    colors: [
      { name: "Matte Black", hex: "#111110" },
      { name: "Earth Khaki", hex: "#82796B" },
    ],
    details: ["100% Heavy Twill", "YKK metal zipper fly"],
    fabricCare: ["Machine wash cold"],
    fit: "Wide Relaxed Fit",
    rating: 4.8,
    reviewCount: 22,
    isActive: true,
  },
  {
    id: "prod-technical-windbreaker",
    title: "Weatherproof Technical Layering Jacket",
    slug: "weatherproof-technical-layering-jacket",
    description: "Engineered for unpredictable urban weather. Features bonded tape seams, two-way waterproof zip, and dual chest storm flap pockets.",
    imageUrl: "/images/nxtvie/promo-jackets-hd.jpg",
    image: "/images/nxtvie/promo-jackets-hd.jpg",
    images: ["/images/nxtvie/promo-jackets-hd.jpg", "/images/nxtvie/gallery-2.jpg"],
    category: "Jackets",
    collections: ["men", "clothing", "urban-essentials", "new-arrivals"],
    price: 3899,
    originalPrice: 4799,
    stock: 25,
    totalStock: 25,
    lowStockThreshold: 4,
    inStock: true,
    featured: true,
    badge: "New",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Stealth Black", hex: "#121212" },
      { name: "Cement Grey", hex: "#7A7D80" },
    ],
    details: ["Water-resistant DWR coating", "Two-way heavy duty zipper", "Laser-cut ventilation ports"],
    fabricCare: ["Wipe clean or gentle cold wash"],
    fit: "Layering Shell Fit",
    rating: 5.0,
    reviewCount: 16,
    isActive: true,
  },
  {
    id: "prod-urban-shell-jacket",
    title: "Minimalist Modular Urban Shell",
    slug: "minimalist-modular-urban-shell",
    description: "Architectural commuter jacket with magnetic collar closure, hidden phone pouch, and ergonomic sleeve articulation.",
    imageUrl: "/images/nxtvie/promo-asian-minimal-hd.jpg",
    image: "/images/nxtvie/promo-asian-minimal-hd.jpg",
    images: ["/images/nxtvie/promo-asian-minimal-hd.jpg", "/images/nxtvie/gallery-3.jpg"],
    category: "Jackets",
    collections: ["men", "clothing", "urban-essentials", "sale"],
    price: 3499,
    originalPrice: 4999,
    stock: 20,
    totalStock: 20,
    lowStockThreshold: 4,
    inStock: true,
    featured: false,
    badge: "Sale",
    sizes: ["M", "L", "XL"],
    colors: [{ name: "Charcoal Black", hex: "#1C1B1A" }],
    details: ["Triple-layer laminated nylon", "Concealed waterproof pockets"],
    fabricCare: ["Hand wash only"],
    fit: "Modular Boxy Fit",
    rating: 4.9,
    reviewCount: 14,
    isActive: true,
  },
  {
    id: "prod-structured-dad-cap",
    title: "Signature NXTIVE Structured Dad Cap",
    slug: "signature-nxtive-structured-dad-cap",
    description: "Constructed from 100% heavy washed cotton twill. Features low-profile crown, brass buckle adjustment strap, and precision embroidered insignia.",
    imageUrl: "/images/nxtvie/product-cap-hd.jpg",
    image: "/images/nxtvie/product-cap-hd.jpg",
    images: ["/images/nxtvie/product-cap-hd.jpg"],
    category: "Accessories",
    collections: ["urban-essentials", "new-arrivals"],
    price: 799,
    originalPrice: 1099,
    stock: 70,
    totalStock: 70,
    lowStockThreshold: 12,
    inStock: true,
    featured: true,
    badge: "Trending",
    sizes: ["One Size"],
    colors: [
      { name: "Ink Black", hex: "#141414" },
      { name: "Desert Khaki", hex: "#8A7E6C" },
    ],
    details: ["100% Chino Twill", "Antique brass tri-glide closure", "Pre-curved visor"],
    fabricCare: ["Spot clean only"],
    fit: "Adjustable Strapback",
    rating: 4.9,
    reviewCount: 45,
    isActive: true,
  },
  {
    id: "prod-canvas-utility-tote",
    title: "Reinforced Heavyweight Canvas Tote",
    slug: "reinforced-heavyweight-canvas-tote",
    description: "16 oz heavy natural duck canvas with reinforced cross-stitched handles, internal key clip, and padded 16\" laptop sleeve compartment.",
    imageUrl: "/images/nxtvie/cat-accessories.jpg",
    image: "/images/nxtvie/cat-accessories.jpg",
    images: ["/images/nxtvie/cat-accessories.jpg"],
    category: "Accessories",
    collections: ["urban-essentials", "premium-basics"],
    price: 899,
    originalPrice: 1199,
    stock: 55,
    totalStock: 55,
    lowStockThreshold: 8,
    inStock: true,
    featured: false,
    badge: "Bestseller",
    sizes: ["One Size"],
    colors: [
      { name: "Ecru Canvas", hex: "#E8E4DA" },
      { name: "Carbon Black", hex: "#1B1A19" },
    ],
    details: ["16 oz Heavy Organic Duck Canvas", "Internal padded laptop divider"],
    fabricCare: ["Spot clean with mild soap"],
    fit: "Roomy 22L Capacity",
    rating: 4.8,
    reviewCount: 27,
    isActive: true,
  },
];

export async function fetchStorefrontProducts(): Promise<Product[]> {
  try {
    const products = await readActiveDocuments("products", normalizeProduct);
    if (products.length > 0) return products;
  } catch {
    // Continue
  }


  // Client-side fallback: check API
  try {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data
          .map((item: any) => normalizeProduct(item.id || item.slug || String(Math.random()), item))
          .filter((p: any): p is Product => p !== null);
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
  if (!Array.isArray(products)) return DEFAULT_CATEGORIES;
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
  if (!Array.isArray(products)) return [];
  const normalized = String(slug || "").toLowerCase();
  if (normalized === "all" || normalized === "shop") return products;
  return products.filter((product) => {
    if (!product) return false;
    const category = String(product.category || "").toLowerCase();
    const collections = Array.isArray(product.collections) ? product.collections : [];
    return (
      category === normalized ||
      category.replace(/\s+/g, "-") === normalized ||
      collections.includes(normalized) ||
      (normalized === "sale" && (product.badge === "Sale" || (product.originalPrice != null && product.originalPrice > product.price))) ||
      (normalized === "new-arrivals" && (product.badge === "New" || collections.includes("new-arrivals"))) ||
      (normalized === "clothing" && category !== "accessories")
    );
  });
}

export function relatedProducts(products: Product[], productId: string, limit = 4): Product[] {
  if (!Array.isArray(products)) return [];
  const current = products.find((product) => product && product.id === productId);
  if (!current) return products.slice(0, limit);
  return products
    .filter((product) => product && product.id !== productId && product.category === current.category)
    .concat(products.filter((product) => product && product.id !== productId && product.category !== current.category))
    .slice(0, limit);
}
