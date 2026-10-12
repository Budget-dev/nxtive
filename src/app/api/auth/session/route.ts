import "server-only";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { assertSameOrigin, AuthError, requireAdmin, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/server/auth";

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
    return NextResponse.json({ success: true, data: profile(admin) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") || "")?.[1];
    if (!token) throw new AuthError();
    const admin = await requireAdmin(undefined, request);
    // A new persistent session requires a recent Firebase sign-in.
    const age = Math.floor(Date.now() / 1000) - admin.auth_time;
    if (!Number.isFinite(age) || age < -60 || age > 300) {
      throw new AuthError("Please sign in again to continue");
    }
    const session = await adminAuth.createSessionCookie(token, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
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
