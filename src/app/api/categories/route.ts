import { NextResponse } from "next/server";
import { storeReadCollection, storeSetDocument, storeDeleteDocument } from "@/lib/firebase/firestore-store";
import { normalizeCategory, DEFAULT_CATEGORIES } from "@/lib/catalog";
import type { Category } from "@/types/product";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/categories] Error fetching categories:", error);
    return NextResponse.json({ success: true, categories: DEFAULT_CATEGORIES });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !body.id) {
      return NextResponse.json({ success: false, error: "Invalid category payload" }, { status: 400 });
    }

    await storeSetDocument("categories", body.id, body);

    return NextResponse.json({ success: true, id: body.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("[api/categories POST] Error saving category:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Category id is required" }, { status: 400 });
    }

    await storeDeleteDocument("categories", id);

    return NextResponse.json({ success: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    console.error("[api/categories DELETE] Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
