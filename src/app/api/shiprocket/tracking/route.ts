import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { shiprocket } from "@/server/delivery/shiprocket";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const awb = searchParams.get("awb")?.trim();
    const orderId = searchParams.get("orderId")?.trim();

    if (!awb && !orderId) {
      return NextResponse.json(
        { success: false, error: "Please provide either ?awb= or ?orderId= parameter." },
        { status: 400 }
      );
    }

    const query = (awb || orderId) as string;
    const trackingData = await shiprocket.syncTracking(query);

    return NextResponse.json({
      success: true,
      data: trackingData,
    });
  } catch (err: any) {
    console.error("[API /api/shiprocket/tracking error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch Shiprocket tracking.",
      },
      { status: err?.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const awb = body.awb?.trim();
    const orderId = body.orderId?.trim();

    if (!awb && !orderId) {
      return NextResponse.json(
        { success: false, error: "Please provide either awb or orderId in the request body." },
        { status: 400 }
      );
    }

    const query = (awb || orderId) as string;
    const trackingData = await shiprocket.syncTracking(query);

    return NextResponse.json({
      success: true,
      data: trackingData,
    });
  } catch (err: any) {
    console.error("[API /api/shiprocket/tracking error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch Shiprocket tracking.",
      },
      { status: err?.statusCode || 500 }
    );
  }
}
