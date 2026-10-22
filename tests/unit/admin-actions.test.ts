import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "empty" as "empty" | "failure" | "write-failure",
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => ({
  requireAdmin: vi.fn(async () => ({ uid: "admin-1", role: "super_admin", permissions: [] })),
  requireUser: vi.fn(async () => null),
}));
vi.mock("@/lib/firebase/firestore-store", () => ({
  storeReadCollection: vi.fn(async (name: string) => {
    if (state.mode === "failure") throw new Error(`private firestore failure for ${name}`);
    return [];
  }),
  storeReadDocument: vi.fn(async (name: string, id: string) => {
    if (state.mode === "failure") throw new Error(`private firestore failure for ${name}/${id}`);
    return null;
  }),
  storeSetDocument: vi.fn(async () => {
    if (state.mode === "write-failure") throw new Error("private write failure");
  }),
  storeUpdateDocument: vi.fn(async () => {
    if (state.mode === "write-failure") throw new Error("private write failure");
  }),
  storeDeleteDocument: vi.fn(async () => {
    if (state.mode === "write-failure") throw new Error("private write failure");
  }),
}));
vi.mock("@/lib/firebase/admin", () => ({
  hasAdminCredentials: true,
  adminDb: {
    collection: (name: string) => ({
      get: async () => {
        if (state.mode === "failure") throw new Error(`private firestore failure for ${name}`);
        return { empty: true, docs: [] };
      },
      doc: (id: string) => ({
        get: async () => {
          if (state.mode === "failure") throw new Error(`private firestore failure for ${name}/${id}`);
          return { exists: false, id, data: () => undefined };
        },
        set: async () => {
          if (state.mode === "write-failure") throw new Error("private write failure");
        },
        update: async () => {
          if (state.mode === "write-failure") throw new Error("private write failure");
        },
        delete: async () => {
          if (state.mode === "write-failure") throw new Error("private write failure");
        },
      }),
    }),
    batch: () => ({ set: vi.fn(), update: vi.fn(), commit: vi.fn(async () => undefined) }),
  },
}));

describe("Firestore-backed admin actions", () => {
  let getAdminProducts: typeof import("@/features/admin-dashboard/server/actions").getAdminProducts;
  let saveProduct: typeof import("@/features/admin-dashboard/server/actions").saveProduct;
  let issueRefund: typeof import("@/features/admin-dashboard/server/actions").issueRefund;

  beforeAll(async () => {
    ({ getAdminProducts, saveProduct, issueRefund } = await import("@/features/admin-dashboard/server/actions"));
  });

  beforeEach(() => {
    state.mode = "empty";
  });

  it("returns a genuine empty collection when Firestore is reachable and empty", async () => {
    await expect(getAdminProducts()).resolves.toEqual([]);
  });

  it("surfaces a safe service error instead of returning an empty fallback", async () => {
    state.mode = "failure";
    await expect(getAdminProducts()).rejects.toMatchObject({
      name: "AdminDataError",
      message: expect.not.stringContaining("private firestore failure"),
    });
  });

  it("reports a failed write instead of claiming persistence succeeded", async () => {
    state.mode = "write-failure";
    await expect(
      saveProduct({
        title: "Persisted Test Product",
        slug: "persisted-test-product",
        category: "T-Shirts",
        image: "/products/test.jpg",
        price: 100,
        colors: [{ name: "Black", hex: "#000000" }],
        sizes: ["M"],
      })
    ).rejects.toMatchObject({
      name: "AdminDataError",
      message: expect.not.stringContaining("private write failure"),
    });
  });

  it("does not claim that an unsupported refund was persisted", async () => {
    await expect(issueRefund("order-1", 100, "customer request")).resolves.toEqual({
      success: false,
      error: "Refunds are unavailable until the payment provider refund integration is implemented.",
    });
  });
});
