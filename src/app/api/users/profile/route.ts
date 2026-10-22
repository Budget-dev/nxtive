// GET & PATCH /api/users/profile — Manages user profile information and settings
import { NextRequest, NextResponse } from "next/server";
import { storeReadDocument, storeSetDocument, storeUpdateDocument } from "@/lib/firebase/firestore-store";
import { requireUser } from "@/server/auth";

async function parseBody(req: NextRequest) {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(text.replace(/\\"/g, '"'));
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryUid = url.searchParams.get("uid");
    const authUser = await requireUser(req).catch(() => null);

    const uid = queryUid || authUser?.uid;
    if (!uid) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    let userDoc = await storeReadDocument<any>("users", uid);

    if (!userDoc) {
      // Create initial doc if it doesn't exist
      userDoc = {
        id: uid,
        displayName: authUser?.name || authUser?.email?.split("@")[0] || "Customer",
        name: authUser?.name || authUser?.email?.split("@")[0] || "Customer",
        email: authUser?.email || "",
        phone: "",
        addresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storeSetDocument("users", uid, userDoc, true);
    }

    return NextResponse.json({ success: true, data: userDoc });
  } catch (error: any) {
    console.error("[users-profile-get] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to get profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const authUser = await requireUser(req).catch(() => null);
    const uid = body.uid || authUser?.uid;

    if (!uid) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.displayName !== undefined) updates.displayName = String(body.displayName).trim();
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.phone !== undefined) updates.phone = String(body.phone).trim();
    if (body.city !== undefined) updates.city = String(body.city).trim();
    if (body.state !== undefined) updates.state = String(body.state).trim();
    if (Array.isArray(body.addresses)) updates.addresses = body.addresses;

    let userDoc = await storeReadDocument<any>("users", uid);
    if (!userDoc) {
      userDoc = {
        id: uid,
        email: authUser?.email || "",
        ...updates,
        createdAt: new Date().toISOString(),
      };
      await storeSetDocument("users", uid, userDoc, true);
    } else {
      await storeUpdateDocument("users", uid, updates);
      userDoc = { ...userDoc, ...updates };
    }

    return NextResponse.json({ success: true, data: userDoc });
  } catch (error: any) {
    console.error("[users-profile-patch] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update profile" }, { status: 500 });
  }
}
