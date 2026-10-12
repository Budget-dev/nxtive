import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/admin/seed-products/route";

describe("admin sample-data endpoint", () => {
  it("is permanently disabled for both methods", async () => {
    const getResponse = await GET();
    const postResponse = await POST();

    expect(getResponse.status).toBe(410);
    expect(postResponse.status).toBe(410);
    await expect(getResponse.json()).resolves.toMatchObject({ dataState: "disabled", success: false });
    await expect(postResponse.json()).resolves.toMatchObject({ dataState: "disabled", success: false });
  });
});
