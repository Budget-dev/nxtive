import { NextRequest, NextResponse } from "next/server";
import { storeSetDocument, storeReadCollection } from "@/lib/firebase/firestore-store";
import { requireAdmin, AuthError, PRIMARY_ADMIN_EMAIL } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const id = String(body.id).trim();
    if (!id || id.length > 128) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const isSuperAdminEmail = email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

    // Prevent privilege escalation: only the primary admin email can be synced with admin roles
    let assignedRole = "customer";
    if (isSuperAdminEmail && (body.role === "admin" || body.role === "super_admin")) {
      assignedRole = body.role;
    }

    const now = new Date().toISOString();
    const userDoc = {
      id,
      uid: id,
      name: body.name || body.displayName || email.split("@")[0] || "Customer",
      displayName: body.displayName || body.name || email.split("@")[0] || "Customer",
      email,
      phone: body.phone || "",
      photoURL: body.photoURL || "",
      avatarUrl: body.avatarUrl || body.photoURL || "",
      role: assignedRole,
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

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin("customers.view", req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const users = await storeReadCollection("users");
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch users" }, { status: 500 });
  }
}

