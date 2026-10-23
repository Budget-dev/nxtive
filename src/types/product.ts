// Shared TypeScript types for the "product" domain.

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  price?: number; // override base price if needed
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export type ProductCategory =
  | "T-Shirts"
  | "Shirts"
  | "Hoodies"
  | "Bottoms"
  | "Accessories"
  | "Jackets";

export type ProductBadge = "Bestseller" | "New" | "Trending" | "Sale";

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  imageUrl?: string;
  images: string[];
  category: ProductCategory;
  collections: string[];
  badge?: ProductBadge | null;
  colors: ProductColor[];
  sizes: string[];
  description: string;
  details: string[];
  fabricCare: string[];
  fit: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured?: boolean;
  sku?: string;
  variants?: ProductVariant[];
  totalStock?: number;
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  image: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface InventoryRecord {
  productId: string;
  variantSku: string;
  size: string;
  color: string;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  lastRestockedAt?: string;
  updatedAt?: string;
}
