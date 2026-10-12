// Razorpay verification is intentionally disabled while COD is the only
// supported payment method. Razorpay webhooks remain separately authenticated.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Online payments are temporarily unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
