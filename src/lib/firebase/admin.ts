// Privileged Firebase access. Never initialize an ambient/project-only account.
// Lazy access lets Next.js build without secrets; every runtime operation fails
// closed unless an explicit service account has been configured.
import "server-only";

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

export const hasAdminCredentials = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
);

export class FirebaseAdminUnavailableError extends Error {
  constructor() {
    super("Server authentication is not configured");
    this.name = "FirebaseAdminUnavailableError";
  }
}

function getAdminApp(): App {
  if (!hasAdminCredentials) throw new FirebaseAdminUnavailableError();
  const existing = getApps().find((app) => app.name === "nxtive-server");
  if (existing) return existing;

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  }, "nxtive-server");
}

function lazyService<T extends object>(initialize: () => T): T {
  let service: T | undefined;
  return new Proxy({} as T, {
    get(_target, property) {
      service ??= initialize();
      const value = Reflect.get(service, property, service);
      return typeof value === "function" ? value.bind(service) : value;
    },
  });
}

export const adminApp: App = lazyService(getAdminApp);
export const adminDb: Firestore = lazyService(() => getFirestore(getAdminApp()));
export const adminAuth: Auth = lazyService(() => getAuth(getAdminApp()));
