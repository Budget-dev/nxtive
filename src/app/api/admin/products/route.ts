import { NextRequest, NextResponse } from "next/server";
import { getAdminProducts, saveProduct } from "@/features/admin-dashboard/server/actions";
import { AdminDataError } from "@/features/admin-dashboard/server/admin-data";
import { AuthError, requireAdmin } from "@/server/auth";
import { createProductSchema } from "@/validation/product.schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const stockStatus = searchParams.get("stockStatus") || undefined;

    const products = await getAdminProducts({ category, search, stockStatus });
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const status = error instanceof AuthError ? error.status : error instanceof AdminDataError ? 503 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof AuthError || error instanceof AdminDataError
          ? error.message
          : "Failed to fetch products",
        dataState: error instanceof AdminDataError ? error.state : "error",
      },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin("products.create", req);
    const body = await req.json();
    const parsed = createProductSchema.safeParse({ ...body, rating: 0, reviewCount: 0, totalStock: body.totalStock ?? 0 });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await saveProduct(parsed.data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const status = error instanceof AuthError ? error.status : error instanceof AdminDataError ? 503 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof AuthError || error instanceof AdminDataError
          ? error.message
          : "Failed to create product",
        dataState: error instanceof AdminDataError ? error.state : "error",
      },
      { status }
    );
  }
}
