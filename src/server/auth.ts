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

  // If neither bearer token nor session cookie is provided, request is strictly unauthenticated
  if (!bearer && !session) {
    return null;
  }

  if (!hasAdminCredentials) {
    // If bearer token is provided in dev mode, inspect payload
    if (bearer) {
      try {
        const parts = bearer.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          if (payload && payload.email) {
            const isSuper = payload.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
            return {
              uid: payload.user_id || payload.sub || "admin-venkatesh",
              email: payload.email,
              email_verified: Boolean(payload.email_verified),
              auth_time: payload.auth_time || Math.floor(Date.now() / 1000),
              role: isSuper ? "super_admin" : "customer",
              permissions: isSuper ? ALL_ADMIN_PERMISSIONS : [],
              displayName: payload.name || "Venkatesh (Super Admin)",
              isActive: true,
              aud: payload.aud || "nxtive-80349",
              exp: payload.exp || Math.floor(Date.now() / 1000) + 3600,
              iat: payload.iat || Math.floor(Date.now() / 1000),
              iss: payload.iss || "https://securetoken.google.com/nxtive-80349",
              sub: payload.sub || payload.user_id || "admin-venkatesh",
              firebase: payload.firebase || { identities: { email: [payload.email] }, sign_in_provider: "google.com" },
            } as any;
          }
        }
      } catch {
        // Fall through
      }
    }

    // In dev without service account, only grant session if valid established dev session cookie exists
    if (session === "dev-admin-session-cookie") {
      return DEV_ADMIN_IDENTITY;
    }

    return null;
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
  const user = await requireUser(request);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  // Strict enforcement: Only venkateshchop14@gmail.com is authorized
  if (user.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    throw new AuthError(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized to access the admin operations console.`, 403);
  }

  if (!hasAdminCredentials) {
    return {
      ...DEV_ADMIN_IDENTITY,
      uid: user.uid || DEV_ADMIN_IDENTITY.uid,
      email: PRIMARY_ADMIN_EMAIL,
      displayName: (user as any).displayName || user.name || DEV_ADMIN_IDENTITY.displayName,
    };
  }

  let data: FirebaseFirestore.DocumentData | undefined;
  try {
    const adminDoc = await adminDb.collection("admin_users").doc(user.uid).get();
    data = adminDoc.exists ? adminDoc.data() : undefined;
  } catch {
    // If collection read is temporarily unavailable, allow primary admin through
  }

  const isSuperAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
  const role = isSuperAdmin ? "super_admin" : (data?.role || "customer");
  const permissions: AdminPermission[] = isSuperAdmin
    ? ALL_ADMIN_PERMISSIONS
    : Array.isArray(data?.permissions)
    ? data.permissions.filter((value: unknown): value is AdminPermission => typeof value === "string")
    : [];

  if (!isSuperAdmin && (data?.isActive !== true || role === "customer")) {
    throw new AuthError("Admin access required", 403);
  }

  if (permission && role !== "super_admin" && !permissions.includes(permission)) {
    throw new AuthError("Admin access required", 403);
  }

  // Auto-provision admin document in Firestore for venkateshchop14@gmail.com if missing
  if (isSuperAdmin && (!data || data.role !== "super_admin")) {
    try {
      await adminDb.collection("admin_users").doc(user.uid).set(
        {
          id: user.uid,
          uid: user.uid,
          email: PRIMARY_ADMIN_EMAIL,
          role: "super_admin",
          isActive: true,
          permissions: ALL_ADMIN_PERMISSIONS,
          displayName: user.name || "Venkatesh (Super Admin)",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Safe fallback
    }
  }

  return {
    ...user,
    role,
    permissions,
    displayName: typeof data?.displayName === "string" ? data.displayName : user.name || "Venkatesh (Admin)",
    ...(typeof data?.avatarUrl === "string" ? { avatarUrl: data.avatarUrl } : {}),
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
