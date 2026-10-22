import { NextRequest, NextResponse } from "next/server";
import { storeSetDocument, storeReadCollection } from "@/lib/firebase/firestore-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const id = String(body.id);
    const now = new Date().toISOString();
    const userDoc = {
      id,
      name: body.name || body.displayName || body.email?.split("@")[0] || "Customer",
      displayName: body.displayName || body.name || body.email?.split("@")[0] || "Customer",
      email: body.email || "",
      phone: body.phone || "",
      photoURL: body.photoURL || "",
      avatarUrl: body.avatarUrl || body.photoURL || "",
      role: body.role || "customer",
      accountStatus: body.accountStatus || "active",
      isActive: body.isActive !== false,
      ordersCount: Number(body.ordersCount || 0),
      totalSpent: Number(body.totalSpent || 0),
      city: body.city || "Mumbai",
      state: body.state || "Maharashtra",
      registrationDate: body.registrationDate || body.createdAt || now,
      createdAt: body.createdAt || now,
      lastActivity: now,
      lastLoginAt: now,
      updatedAt: now,
    };

    await storeSetDocument("users", id, userDoc, true);
    return NextResponse.json({ success: true, data: userDoc });
  } catch (error: any) {
    console.error("Failed to sync user:", error);
    return NextResponse.json({ success: false, error: error?.message || "User sync failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await storeReadCollection("users");
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch users" }, { status: 500 });
  }
}
