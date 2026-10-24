import { NextResponse } from "next/server";
import { storeReadCollection } from "@/lib/firebase/firestore-store";
import { normalizeCategory, DEFAULT_CATEGORIES } from "@/lib/catalog";
import type { Category } from "@/types/product";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await storeReadCollection<Record<string, unknown>>("categories");
    const categories: Category[] = (raw || [])
      .map((item) => normalizeCategory(String(item.id || ""), item))
      .filter((c): c is Category => c !== null && c.isActive !== false);

    const sorted =
      categories.length > 0
        ? categories.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        : DEFAULT_CATEGORIES;

    return NextResponse.json(
      { success: true, categories: sorted },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[api/categories] Error fetching categories:", error);
    return NextResponse.json({ success: true, categories: DEFAULT_CATEGORIES });
  }
}
