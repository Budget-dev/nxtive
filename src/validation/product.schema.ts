import { z } from "zod";

export const productColorSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  hex: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Valid hex code required"),
});

export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  price: z.number().positive().optional(),
});

export const createProductSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  price: z.number().positive("Price must be greater than 0"),
  originalPrice: z.number().positive("Original price must be greater than 0").optional().nullable(),
  image: z.string().min(1, "Main image URL is required"),
  images: z.array(z.string().min(1)).min(1, "At least one image is required"),
  category: z.enum([
    "T-Shirts",
    "Shirts",
    "Hoodies",
    "Bottoms",
    "Jackets",
  ] as const),
  collections: z.array(z.string()).default([]),
  badge: z.enum(["Bestseller", "New", "Trending", "Sale"] as const).optional().nullable(),
  colors: z.array(productColorSchema).min(1, "At least one color is required"),
  sizes: z.array(z.string().min(1)).min(1, "At least one size is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  details: z.array(z.string()).default([]),
  fabricCare: z.array(z.string()).default([]),
  fit: z.string().default("Regular Fit"),
  rating: z.number().min(0).max(5).default(4.8),
  reviewCount: z.number().int().min(0).default(0),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sku: z.string().optional(),
  variants: z.array(productVariantSchema).optional().default([]),
  totalStock: z.number().int().min(0).default(100),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
