// POST /api/payment/verify — Unified payment signature verification route
import "server-only";

import { NextRequest } from "next/server";
import { POST as handleVerify } from "@/app/api/razorpay/verify-payment/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  return handleVerify(req);
}
