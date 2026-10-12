import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type DocumentRecord = { data: Record<string, any> };

const mocks = vi.hoisted(() => {
  class MockAuthError extends Error {
    status: number;

    constructor(message = "Unauthorized", status = 401) {
      super(message);
      this.status = status;
    }
  }

  return {
    adminDb: {} as Record<string, any>,
    requireUser: vi.fn(),
    tryRequireAdmin: vi.fn().mockResolvedValue(null),
    AuthError: MockAuthError,
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => mocks);
vi.mock("@/lib/firebase/admin", () => ({ adminDb: mocks.adminDb }));

function responseRequest(body: Record<string, unknown>, method = "POST") {
  return new NextRequest("http://localhost/api/orders", {
    method,
    headers: { "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}

function snapshot(path: string, record: DocumentRecord | undefined) {
  return {
    id: path.split("/").pop() || "",
    exists: Boolean(record),
    data: () => record?.data,
  };
}

function fakeDb(options?: {
  user?: Record<string, any>;
  product?: Record<string, any>;
}) {
  const documents = new Map<string, DocumentRecord>();
  const writes: { type: string; path: string; data?: Record<string, any> }[] = [];
  let generatedOrderNumber = 0;

  documents.set("users/uid-real", {
    data: options?.user || { isActive: true, accountStatus: "active" },
  });
  documents.set("products/prod-1", {
    data: options?.product || {
      title: "Server priced tee",
      slug: "server-priced-tee",
      price: 100,
      image: "/tee.jpg",
      sizes: ["M"],
      colors: [{ name: "Black" }],
      isActive: true,
      inStock: true,
      totalStock: 5,
    },
  });

  const reference = (path: string) => ({
    path,
    id: path.split("/").pop() || "",
  });
  const collection = (name: string) => ({
    doc(id?: string) {
      const docId = id || `order-${++generatedOrderNumber}`;
      return reference(`${name}/${docId}`);
    },
    orderBy() {
      return this;
    },
    where() {
      return this;
    },
    limit() {
      return this;
    },
    offset() {
      return this;
    },
    async get() {
      const docs = [...documents.entries()]
        .filter(([path]) => path.startsWith(`${name}/`))
        .map(([path, record]) => snapshot(path, record));
      return { empty: docs.length === 0, docs };
    },
  });

  const db = {
    collection,
    async runTransaction(callback: (transaction: any) => Promise<unknown>) {
      const transaction = {
        async get(target: { path: string }) {
          return snapshot(target.path, documents.get(target.path));
        },
        create(target: { path: string }, data: Record<string, any>) {
          writes.push({ type: "create", path: target.path, data });
          documents.set(target.path, { data: { ...data } });
        },
        update(target: { path: string }, data: Record<string, any>) {
          writes.push({ type: "update", path: target.path, data });
          const previous = documents.get(target.path)?.data || {};
          documents.set(target.path, { data: { ...previous, ...data } });
        },
      };
      return callback(transaction);
    },
  };

  return { db, documents, writes };
}

const validOrder = {
  items: [{
    productId: "prod-1",
    title: "Client supplied title",
    price: 1,
    quantity: 1,
    selectedSize: "M",
    selectedColor: "Black",
    image: "/client-image.jpg",
  }],
  shippingAddress: {
    fullName: "Real User",
    email: "real@example.com",
    phone: "9876543210",
    street: "1 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
  },
  deliveryMethod: "Standard Domestic (3-5 Days)",
  userId: "uid-real",
  idempotencyKey: "stable-order-key-1",
};

let ordersPost: (request: NextRequest) => Promise<Response>;
let createPaymentPost: (request: Request) => Promise<Response>;
let verifyPaymentPost: (request: Request) => Promise<Response>;
let refundPost: (request: Request) => Promise<Response>;

beforeAll(async () => {
  ({ POST: ordersPost } = await import("@/app/api/orders/route"));
  ({ POST: createPaymentPost } = await import("@/app/api/payments/create-order/route"));
  ({ POST: verifyPaymentPost } = await import("@/app/api/payments/verify/route"));
  ({ POST: refundPost } = await import("@/app/api/payments/refund/route"));
});

beforeEach(() => {
  mocks.requireUser.mockReset();
  mocks.requireUser.mockResolvedValue({ uid: "uid-real", email: "real@example.com" });
  mocks.tryRequireAdmin.mockReset();
  mocks.tryRequireAdmin.mockResolvedValue(null);
  for (const key of Object.keys(mocks.adminDb)) delete mocks.adminDb[key];
});

describe("COD order route security", () => {
  it("rejects unauthenticated creation before reading client input", async () => {
    mocks.requireUser.mockResolvedValue(null);
    const response = await ordersPost(responseRequest(validOrder));

    expect(response.status).toBe(401);
    expect((await response.json()).success).toBe(false);
  });

  it("rejects a caller spoofing another user id", async () => {
    const database = fakeDb();
    Object.assign(mocks.adminDb, database.db);
    const response = await ordersPost(responseRequest({ ...validOrder, userId: "uid-attacker" }));

    expect(response.status).toBe(403);
    expect(database.writes).toHaveLength(0);
  });

  it("uses the catalogue price and does not persist a fabricated tracking number", async () => {
    const database = fakeDb();
    Object.assign(mocks.adminDb, database.db);
    const response = await ordersPost(responseRequest(validOrder));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items[0].price).toBe(100);
    expect(body.data.total).toBe(199);
    expect(body.data.trackingNumber).toBeUndefined();
    expect(database.documents.get("products/prod-1")?.data.totalStock).toBe(4);
  });

  it("aggregates duplicate product lines before checking stock", async () => {
    const database = fakeDb();
    Object.assign(mocks.adminDb, database.db);
    const response = await ordersPost(responseRequest({
      ...validOrder,
      items: [
        { ...validOrder.items[0], quantity: 3 },
        { ...validOrder.items[0], quantity: 3 },
      ],
      idempotencyKey: "duplicate-line-stock-key",
    }));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("quantity");
    expect(database.writes).toHaveLength(0);
  });

  it("returns the same order on an idempotency replay without decrementing stock twice", async () => {
    const database = fakeDb();
    Object.assign(mocks.adminDb, database.db);

    const first = await ordersPost(responseRequest(validOrder));
    const firstBody = await first.json();
    const second = await ordersPost(responseRequest(validOrder));
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondBody.data.id).toBe(firstBody.data.id);
    expect(database.documents.get("products/prod-1")?.data.totalStock).toBe(4);
    expect(database.writes.filter((write) => write.type === "create")).toHaveLength(2);
  });

  it("rejects an inactive authenticated user", async () => {
    const database = fakeDb({ user: { isActive: false, accountStatus: "suspended" } });
    Object.assign(mocks.adminDb, database.db);
    const response = await ordersPost(responseRequest(validOrder));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("active");
    expect(database.writes).toHaveLength(0);
  });

  it("rejects shipping countries outside India", async () => {
    const database = fakeDb();
    Object.assign(mocks.adminDb, database.db);
    const response = await ordersPost(responseRequest({
      ...validOrder,
      shippingAddress: { ...validOrder.shippingAddress, country: "United States" },
    }));

    expect(response.status).toBe(400);
    expect(database.writes).toHaveLength(0);
  });
});

describe("server-side online payment gates", () => {
  it.each([
    ["create", () => createPaymentPost(new Request("http://localhost/api/payments/create-order", { method: "POST" }))],
    ["verify", () => verifyPaymentPost(new Request("http://localhost/api/payments/verify", { method: "POST" }))],
    ["refund", () => refundPost(new Request("http://localhost/api/payments/refund", { method: "POST" }))],
  ])("returns 503 for %s even when called directly", async (_name, invoke) => {
    const response = await invoke();
    expect(response.status).toBe(503);
    expect((await response.json()).success).toBe(false);
  });
});
