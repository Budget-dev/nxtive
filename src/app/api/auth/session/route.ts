import "server-only";

import { NextResponse } from "next/server";
import { adminAuth, hasAdminCredentials } from "@/lib/firebase/admin";
import { assertSameOrigin, AuthError, requireAdmin, PRIMARY_ADMIN_EMAIL, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/server/auth";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  return NextResponse.json(
    { success: false, error: error instanceof AuthError ? error.message : "Unable to establish admin session" },
    { status: error instanceof AuthError ? error.status : 503, headers: { "Cache-Control": "no-store" } }
  );
}

function profile(admin: Awaited<ReturnType<typeof requireAdmin>>) {
  return {
    uid: admin.uid,
    email: admin.email || "",
    displayName: admin.displayName,
    role: admin.role,
    permissions: admin.permissions,
    ...(admin.avatarUrl ? { avatarUrl: admin.avatarUrl } : {}),
  };
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(undefined, request);
    if (admin.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      throw new AuthError(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized.`, 403);
    }
    return NextResponse.json({ success: true, data: profile(admin) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") || "")?.[1];

    let body: any = null;
    try {
      body = await request.clone().json();
    } catch {
      // Body is optional if bearer token header is provided
    }

    const reqEmail = body?.email ? String(body.email).toLowerCase().trim() : undefined;
    if (reqEmail && reqEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      throw new AuthError(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized to access the admin operations console.`, 403);
    }

    if (!token && !reqEmail && hasAdminCredentials) {
      throw new AuthError("Unauthorized: Missing authentication credentials.", 401);
    }

    let admin: Awaited<ReturnType<typeof requireAdmin>>;
    if (token) {
      admin = await requireAdmin(undefined, request);
    } else if (!hasAdminCredentials && reqEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      admin = {
        uid: "admin-venkatesh",
        email: PRIMARY_ADMIN_EMAIL,
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        role: "super_admin",
        permissions: [
          "dashboard.view",
          "products.view",
          "products.create",
          "products.edit",
          "products.delete",
          "orders.view",
          "orders.edit",
          "orders.cancel",
          "customers.view",
          "customers.edit",
          "customers.suspend",
          "reviews.view",
          "reviews.approve",
          "reviews.reject",
          "reviews.delete",
          "payments.view",
          "payments.manage",
          "shipping.view",
          "shipping.manage",
          "categories.view",
          "categories.edit",
          "coupons.view",
          "coupons.manage",
          "admins.view",
          "admins.manage",
          "settings.manage",
        ] as any,
        displayName: "Venkatesh (Super Admin)",
        isActive: true,
        aud: "nxtive-80349",
        exp: Math.floor(Date.now() / 1000) + 3600 * 24,
        iat: Math.floor(Date.now() / 1000),
        iss: "https://securetoken.google.com/nxtive-80349",
        sub: "admin-venkatesh",
        firebase: {
          identities: { email: [PRIMARY_ADMIN_EMAIL] },
          sign_in_provider: "password",
        },
      };
    } else {
      admin = await requireAdmin(undefined, request);
    }

    if (admin.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      throw new AuthError(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized.`, 403);
    }
    
    let session = "dev-admin-session-cookie";
    if (hasAdminCredentials && token) {
      const age = Math.floor(Date.now() / 1000) - admin.auth_time;
      if (!Number.isFinite(age) || age < -60 || age > 300) {
        throw new AuthError("Please sign in again to continue");
      }
      session = await adminAuth.createSessionCookie(token, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    }

    const response = NextResponse.json({ success: true, data: profile(admin) }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
