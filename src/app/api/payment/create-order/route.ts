// POST /api/payment/create-order — Unified payment create-order route
import "server-only";

import { NextRequest } from "next/server";
import { POST as handleCreateOrder } from "@/app/api/razorpay/create-order/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  return handleCreateOrder(req);
}
