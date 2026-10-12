// Razorpay refunds are intentionally disabled while COD is the only supported
// payment method. This is enforced on the server, not just in the dashboard UI.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Online payments are temporarily unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
