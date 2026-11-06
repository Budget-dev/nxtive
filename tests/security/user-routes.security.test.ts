import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  return {
    requireUser: vi.fn(),
    storeReadDocument: vi.fn(),
    storeSetDocument: vi.fn(),
    storeUpdateDocument: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => ({
  requireUser: mocks.requireUser,
  PRIMARY_ADMIN_EMAIL: "nxtiveclothing@gmail.com",
}));
vi.mock("@/lib/firebase/firestore-store", () => ({
  storeReadDocument: mocks.storeReadDocument,
  storeSetDocument: mocks.storeSetDocument,
  storeUpdateDocument: mocks.storeUpdateDocument,
}));

describe("User Routes Security & IDOR Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents signed-in attacker from reading a victim's profile via query param (403)", async () => {
    mocks.requireUser.mockResolvedValue({
      uid: "attacker-123",
      email: "attacker@example.com",
    });

    const { GET } = await import("@/app/api/users/profile/route");
    const req = new NextRequest("http://localhost/api/users/profile?uid=victim-456");
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Forbidden");
    expect(mocks.storeReadDocument).not.toHaveBeenCalled();
  });

  it("prevents signed-in attacker from modifying a victim's profile (403)", async () => {
    mocks.requireUser.mockResolvedValue({
      uid: "attacker-123",
      email: "attacker@example.com",
    });

    const { PATCH } = await import("@/app/api/users/profile/route");
    const req = new NextRequest("http://localhost/api/users/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uid: "victim-456", displayName: "Hacked" }),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Forbidden");
    expect(mocks.storeUpdateDocument).not.toHaveBeenCalled();
  });

  it("prevents signed-in attacker from reading a victim's address book (403)", async () => {
    mocks.requireUser.mockResolvedValue({
      uid: "attacker-123",
      email: "attacker@example.com",
    });

    const { GET } = await import("@/app/api/users/addresses/route");
    const req = new NextRequest("http://localhost/api/users/addresses?uid=victim-456");
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Forbidden");
  });

  it("prevents signed-in attacker from injecting an address into victim's account (403)", async () => {
    mocks.requireUser.mockResolvedValue({
      uid: "attacker-123",
      email: "attacker@example.com",
    });

    const { POST } = await import("@/app/api/users/addresses/route");
    const req = new NextRequest("http://localhost/api/users/addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        uid: "victim-456",
        address: {
          street: "123 Malicious St",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
        },
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Forbidden");
  });

  it("allows a legitimate user to access their own profile", async () => {
    mocks.requireUser.mockResolvedValue({
      uid: "user-789",
      email: "user@example.com",
      name: "Valued Customer",
    });
    mocks.storeReadDocument.mockResolvedValue({
      id: "user-789",
      displayName: "Valued Customer",
      email: "user@example.com",
    });

    const { GET } = await import("@/app/api/users/profile/route");
    const req = new NextRequest("http://localhost/api/users/profile?uid=user-789");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("user-789");
  });

  it("allows primary admin to inspect a customer's profile", async () => {
    mocks.requireUser.mockResolvedValue({
      uid: "admin-1",
      email: "nxtiveclothing@gmail.com",
    });
    mocks.storeReadDocument.mockResolvedValue({
      id: "customer-999",
      displayName: "Customer Account",
      email: "customer@example.com",
    });

    const { GET } = await import("@/app/api/users/profile/route");
    const req = new NextRequest("http://localhost/api/users/profile?uid=customer-999");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("customer-999");
  });
});
