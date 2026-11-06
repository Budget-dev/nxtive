import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { shiprocket } from "@/server/delivery/shiprocket";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Optional secret token verification
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (webhookSecret) {
      const incomingToken =
        req.headers.get("x-api-key") ||
        req.headers.get("x-shiprocket-token") ||
        new URL(req.url).searchParams.get("token");

      if (incomingToken !== webhookSecret) {
        return NextResponse.json(
          { success: false, error: "Invalid or missing webhook token." },
          { status: 401 }
        );
      }
    }

    const payload = await req.json().catch(() => ({}));

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const result = await shiprocket.handleWebhook(payload);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully.",
      data: result,
    });
  } catch (err: any) {
    console.error("[API /api/shiprocket/webhook error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal webhook processing error.",
      },
      { status: 500 }
    );
  }
}
