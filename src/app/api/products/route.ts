import { NextResponse } from "next/server";
import { storeReadCollection, storeSetDocument } from "@/lib/firebase/firestore-store";
import { normalizeProduct } from "@/lib/catalog";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const raw = await storeReadCollection<Record<string, unknown>>("products");
    const products: Product[] = (raw || [])
      .map((item) => normalizeProduct(String(item.id || ""), item))
      .filter((p): p is Product => p !== null && p.isActive !== false);

    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/products] Error fetching products:", error);
    return NextResponse.json({ success: false, products: [] }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Direct product upsert endpoint — called from product-form.tsx client side.
 * Uses the same storeSetDocument path which now reads/writes via API key REST.
 * This bypasses the broken server-action auth chain on Vercel.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    // Basic required field validation
    const { id, title, slug, category, price, image } = body as any;
    if (!title || !slug || !category || !image || price === undefined) {
      return NextResponse.json(
        { success: false, error: "title, slug, category, image, and price are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const productId = id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const productData: Record<string, unknown> = {
      ...body,
      id: productId,
      isActive: body.isActive !== false,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await storeSetDocument("products", productId, productData);

    return NextResponse.json(
      { success: true, id: productId },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("[api/products POST] Error saving product:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save product" },
      { status: 500 }
    );
  }
}
