// POST /api/payment/webhook — Unified Razorpay webhook receiver
import "server-only";

import { NextRequest } from "next/server";
import { POST as handleWebhook } from "@/app/api/razorpay/webhook/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  return handleWebhook(req);
}
