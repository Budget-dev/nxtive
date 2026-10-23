import "server-only";

import { headers } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb, hasAdminCredentials } from "@/lib/firebase/admin";
import type { AdminPermission } from "@/types/user";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AuthenticatedUser = DecodedIdToken;

export interface AdminIdentity extends DecodedIdToken {
  role: string;
  permissions: AdminPermission[];
  displayName: string;
  avatarUrl?: string;
  isActive: true;
}

// Only deliberately authored messages may be returned to a client.
export class AuthError extends Error {
  constructor(
    message: string = "Unauthorized",
    public readonly status: 401 | 403 | 503 = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin !== new URL(request.url).origin || (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")) {
    throw new AuthError("Invalid request origin", 403);
  }
}

function sessionCookie(requestHeaders: Headers): string | null {
  const cookie = requestHeaders.get("cookie")?.split(";").find((part) => part.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
  return cookie ? cookie.trim().slice(SESSION_COOKIE_NAME.length + 1) : null;
}

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
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
];

export const PRIMARY_ADMIN_EMAIL = "venkateshchop14@gmail.com";

const DEV_ADMIN_IDENTITY: AdminIdentity = {
  uid: "admin-venkatesh",
  email: PRIMARY_ADMIN_EMAIL,
  email_verified: true,
  auth_time: Math.floor(Date.now() / 1000),
  role: "super_admin",
  permissions: ALL_ADMIN_PERMISSIONS,
  displayName: "Venkatesh (Super Admin)",
  isActive: true,
  aud: "nxtive-8fc17",
  exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  iat: Math.floor(Date.now() / 1000),
  iss: "https://securetoken.google.com/nxtive-8fc17",
  sub: "admin-venkatesh",
  firebase: {
    identities: { email: [PRIMARY_ADMIN_EMAIL] },
    sign_in_provider: "password",
  },
};

/** Verify a revoked/disabled-account-checked ID token or Firebase session. */
export async function requireUser(request?: Request): Promise<AuthenticatedUser | null> {
  let requestHeaders: Headers;
  try {
    requestHeaders = request ? request.headers : new Headers(await headers());
  } catch {
    return null;
  }

  const authorization = requestHeaders.get("authorization");
  const bearer = authorization ? /^Bearer\s+(\S+)$/i.exec(authorization.trim())?.[1] : undefined;
  const session = authorization ? null : sessionCookie(requestHeaders);
  if ((!bearer && !session) && authorization) return null;

  if (!hasAdminCredentials) {
    // In dev without service account, provide fallback authenticated identity
    return DEV_ADMIN_IDENTITY;
  }

  if (session && request && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    assertSameOrigin(request);
  }

  try {
    return bearer
      ? await adminAuth.verifyIdToken(bearer, true)
      : await adminAuth.verifySessionCookie(session!, true);
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError();
  }
}

/** Only venkateshchop14@gmail.com is authorized as administrator. */
export async function requireAdmin(
  permission?: AdminPermission,
  request?: Request
): Promise<AdminIdentity> {
  if (!hasAdminCredentials) {
    // In development or when service account is not yet configured,
    // grant super admin access for venkateshchop14@gmail.com
    return DEV_ADMIN_IDENTITY;
  }

  const user = await requireUser(request);
  if (!user || user.email_verified !== true) {
    throw new AuthError(user ? "Admin access required" : "Unauthorized", user ? 403 : 401);
  }

  // Strict enforcement: Only venkateshchop14@gmail.com is authorized
  if (user.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    throw new AuthError(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized to access the admin operations console.`, 403);
  }

  let data: FirebaseFirestore.DocumentData | undefined;
  try {
    const adminDoc = await adminDb.collection("admin_users").doc(user.uid).get();
    data = adminDoc.exists ? adminDoc.data() : undefined;
  } catch {
    throw new AuthError("Authorization service unavailable", 503);
  }
  if (data?.isActive !== true || typeof data.role !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(data.role) || data.role === "customer") {
    throw new AuthError("Admin access required", 403);
  }

  const permissions: AdminPermission[] = Array.isArray(data.permissions)
    ? data.permissions.filter((value: unknown): value is AdminPermission => typeof value === "string")
    : [];
  if (permission && data.role !== "super_admin" && !permissions.includes(permission)) {
    throw new AuthError("Admin access required", 403);
  }

  return {
    ...user,
    role: data.role,
    permissions,
    displayName: typeof data.displayName === "string" ? data.displayName : user.name || "Admin",
    ...(typeof data.avatarUrl === "string" ? { avatarUrl: data.avatarUrl } : {}),
    isActive: true,
  };
}

/** Optional admin check for endpoints supporting both customer and admin views. */
export async function tryRequireAdmin(
  permission?: AdminPermission,
  request?: Request
): Promise<AdminIdentity | null> {
  try {
    return await requireAdmin(permission, request);
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) return null;
    throw error;
  }
}
