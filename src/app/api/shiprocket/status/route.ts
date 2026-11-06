import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { shiprocket } from "@/server/delivery/shiprocket";
import { tryRequireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await tryRequireAdmin(undefined, req).catch(() => null);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized admin access." },
        { status: 401 }
      );
    }

    const status = await shiprocket.getConnectionStatus();

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    console.error("[API /api/shiprocket/status error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to retrieve Shiprocket status.",
      },
      { status: 500 }
    );
  }
}

