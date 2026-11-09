import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { shiprocket } from "@/server/delivery/shiprocket";
import { tryRequireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin access
    const admin = await tryRequireAdmin(undefined, req).catch(() => null);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized admin access." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, pickupLocation } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID (orderId) is required." },
        { status: 400 }
      );
    }

    const result = await shiprocket.createShipmentForOrder(orderId, { pickupLocation });

    const message = result.awbNotice
      ? `Order registered in Shiprocket (Shipment #${result.shipmentId}). Note: ${result.awbNotice}`
      : "Shiprocket shipment created and consignment AWB assigned.";

    return NextResponse.json({
      success: true,
      message,
      data: result,
    });
  } catch (err: any) {
    console.error("[API /api/shiprocket/create-order error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to create Shiprocket order.",
        details: err?.responseData || undefined,
      },
      { status: err?.statusCode || 500 }
    );
  }
}
