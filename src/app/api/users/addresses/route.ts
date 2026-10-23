// GET, POST, PUT, DELETE /api/users/addresses — Manages customer addresses
import { NextRequest, NextResponse } from "next/server";
import { storeReadDocument, storeSetDocument, storeUpdateDocument } from "@/lib/firebase/firestore-store";
import { requireUser } from "@/server/auth";
import type { UserAddress } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryUid = url.searchParams.get("uid");
    const authUser = await requireUser(req).catch(() => null);
    const uid = queryUid || authUser?.uid;

    if (!uid) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const userDoc = await storeReadDocument<any>("users", uid);
    const addresses: UserAddress[] = Array.isArray(userDoc?.addresses) ? userDoc.addresses : [];

    return NextResponse.json({ success: true, data: addresses });
  } catch (error: any) {
    console.error("[users-addresses-get] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch addresses" }, { status: 500 });
  }
}

async function parseBody(req: NextRequest) {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(text.replace(/\\"/g, '"'));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const authUser = await requireUser(req).catch(() => null);
    const uid = body.uid || authUser?.uid;

    if (!uid) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const addr = body.address;
    if (!addr || !addr.street || !addr.city || !addr.state || !addr.postalCode) {
      return NextResponse.json({ success: false, error: "Incomplete address fields" }, { status: 400 });
    }

    let userDoc = await storeReadDocument<any>("users", uid);
    const currentAddresses: UserAddress[] = Array.isArray(userDoc?.addresses) ? [...userDoc.addresses] : [];

    const newAddressId = addr.id || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isFirst = currentAddresses.length === 0;
    const shouldBeDefault = addr.isDefault === true || isFirst;

    let updatedAddresses: UserAddress[] = currentAddresses.map((a) => ({
      ...a,
      isDefault: shouldBeDefault ? false : a.isDefault,
    }));

    const newAddress: UserAddress = {
      id: newAddressId,
      label: addr.label || "Home",
      fullName: addr.fullName || userDoc?.displayName || "Customer",
      phone: addr.phone || userDoc?.phone || "",
      street: addr.street,
      apartment: addr.apartment || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || "India",
      isDefault: shouldBeDefault,
    };

    updatedAddresses.push(newAddress);

    if (!userDoc) {
      userDoc = {
        id: uid,
        displayName: authUser?.name || "Customer",
        email: authUser?.email || "",
        addresses: updatedAddresses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storeSetDocument("users", uid, userDoc, true);
    } else {
      await storeUpdateDocument("users", uid, {
        addresses: updatedAddresses,
        city: updatedAddresses.find((a) => a.isDefault)?.city || userDoc.city,
        state: updatedAddresses.find((a) => a.isDefault)?.state || userDoc.state,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: newAddress,
      addresses: updatedAddresses,
    });
  } catch (error: any) {
    console.error("[users-addresses-post] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save address" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const authUser = await requireUser(req).catch(() => null);
    const uid = body.uid || authUser?.uid;
    const addressId = body.addressId || body.address?.id;

    if (!uid || !addressId) {
      return NextResponse.json({ success: false, error: "User ID and Address ID required" }, { status: 400 });
    }

    const userDoc = await storeReadDocument<any>("users", uid);
    if (!userDoc || !Array.isArray(userDoc.addresses)) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    const currentAddresses: UserAddress[] = [...userDoc.addresses];
    const targetIdx = currentAddresses.findIndex((a) => a.id === addressId);
    if (targetIdx === -1) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    const isSettingDefault = body.address?.isDefault === true || body.isDefault === true;

    const updatedAddresses = currentAddresses.map((a, idx) => {
      if (idx === targetIdx) {
        return {
          ...a,
          ...(body.address || {}),
          id: a.id,
          isDefault: isSettingDefault ? true : (body.address?.isDefault ?? a.isDefault),
        };
      }
      return {
        ...a,
        isDefault: isSettingDefault ? false : a.isDefault,
      };
    });

    await storeUpdateDocument("users", uid, {
      addresses: updatedAddresses,
      city: updatedAddresses.find((a) => a.isDefault)?.city || userDoc.city,
      state: updatedAddresses.find((a) => a.isDefault)?.state || userDoc.state,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updatedAddresses[targetIdx],
      addresses: updatedAddresses,
    });
  } catch (error: any) {
    console.error("[users-addresses-put] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryUid = url.searchParams.get("uid");
    const addressId = url.searchParams.get("addressId");
    const authUser = await requireUser(req).catch(() => null);
    const uid = queryUid || authUser?.uid;

    if (!uid || !addressId) {
      return NextResponse.json({ success: false, error: "User ID and Address ID required" }, { status: 400 });
    }

    const userDoc = await storeReadDocument<any>("users", uid);
    if (!userDoc || !Array.isArray(userDoc.addresses)) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    let updatedAddresses: UserAddress[] = userDoc.addresses.filter((a: UserAddress) => a.id !== addressId);

    // If the removed address was default and there are remaining addresses, set the first as default
    if (updatedAddresses.length > 0 && !updatedAddresses.some((a) => a.isDefault)) {
      updatedAddresses[0] = { ...updatedAddresses[0], isDefault: true };
    }

    await storeUpdateDocument("users", uid, {
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      addresses: updatedAddresses,
    });
  } catch (error: any) {
    console.error("[users-addresses-delete] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete address" }, { status: 500 });
  }
}
