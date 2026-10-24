import { NextResponse } from "next/server";
import { storeReadCollection } from "@/lib/firebase/firestore-store";
import { normalizeProduct } from "@/lib/catalog";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

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
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[api/products] Error fetching products:", error);
    return NextResponse.json({ success: false, products: [] }, { status: 500 });
  }
}
