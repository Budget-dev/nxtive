import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { shiprocket } from "@/server/delivery/shiprocket";
import { tryRequireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await tryRequireAdmin(undefined, req).catch(() => null);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized admin access." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      pickup_location,
      name,
      email,
      phone,
      address,
      address_2,
      city,
      state,
      country,
      pin_code,
    } = body;

    if (!pickup_location || !name || !email || !phone || !address || !city || !state || !pin_code) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields (pickup_location, name, email, phone, address, city, state, pin_code) are required.",
        },
        { status: 400 }
      );
    }

    const payload = {
      pickup_location: String(pickup_location).trim(),
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).replace(/\D/g, "").slice(-10),
      address: String(address).trim(),
      address_2: address_2 ? String(address_2).trim() : "",
      city: String(city).trim(),
      state: String(state).trim(),
      country: country ? String(country).trim() : "India",
      pin_code: String(pin_code).trim(),
    };

    const result = await shiprocket.addPickupLocation(payload);

    return NextResponse.json({
      success: true,
      message: `Pickup location "${payload.pickup_location}" registered successfully in Shiprocket.`,
      data: result,
    });
  } catch (err: any) {
    console.error("[API /api/shiprocket/add-pickup error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to register pickup location in Shiprocket.",
      },
      { status: 500 }
    );
  }
}

