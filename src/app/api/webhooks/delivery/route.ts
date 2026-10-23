import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Delivery-partner webhook receiver (status updates, tracking events)
export async function POST(req: Request) {
  return NextResponse.json({ success: true, message: "Webhook acknowledged" }, { status: 200 });
}
