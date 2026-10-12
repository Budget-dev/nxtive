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
  if ((!bearer && !session) || (authorization && !bearer)) return null;
  if (!hasAdminCredentials) return null;

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

/** Only the server-managed admin_users document grants administrative access. */
export async function requireAdmin(
  permission?: AdminPermission,
  request?: Request
): Promise<AdminIdentity> {
  if (!hasAdminCredentials) throw new AuthError("Authentication service unavailable", 503);
  const user = await requireUser(request);
  if (!user || user.email_verified !== true) throw new AuthError(user ? "Admin access required" : "Unauthorized", user ? 403 : 401);

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
