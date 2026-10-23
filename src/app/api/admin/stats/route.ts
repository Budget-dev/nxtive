import { NextResponse } from "next/server";
import { getDashboardStats } from "@/features/admin-dashboard/server/actions";
import { AdminDataError } from "@/features/admin-dashboard/server/admin-data";
import { AuthError } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: unknown) {
    const status = error instanceof AuthError ? error.status : error instanceof AdminDataError ? 503 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof AuthError || error instanceof AdminDataError
          ? error.message
          : "Failed to load dashboard stats",
        dataState: error instanceof AdminDataError ? error.state : "error",
      },
      { status }
    );
  }
}
