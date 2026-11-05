import { describe, it, expect } from "vitest";
import { slugify, generateOrderNumber, generateTrackingNumber } from "@/utils/slugify";
import { createProductSchema } from "@/validation/product.schema";

describe("E-Commerce Helpers & Validation", () => {
  it("generates url slugs from title", () => {
    expect(slugify("Oversized Heavyweight Boxy Tee")).toBe("oversized-heavyweight-boxy-tee");
    expect(slugify("French Terry Hoodie - Limited Edition!")).toBe("french-terry-hoodie-limited-edition");
  });

  it("generates order numbers with NXTIVE prefix and current year", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^NXTIVE-\d{4}-\d{5}$/);
  });

  it("generates tracking numbers with courier prefix", () => {
    const tracking = generateTrackingNumber("SHIPROCKET");
    expect(tracking).toContain("SHIPROCKET-NXT-");
  });

  it("validates clothing product creation schema", () => {
    const validProduct = {
      title: "Tactile Camp Collar Shirt",
      slug: "tactile-camp-collar-shirt",
      price: 1899,
      image: "/images/nxtvie/product-linen-shirt-hd.jpg",
      images: ["/images/nxtvie/product-linen-shirt-hd.jpg"],
      category: "Shirts" as const,
      colors: [{ name: "Olive Green", hex: "#4A5D4E" }],
      sizes: ["M", "L", "XL"],
      description: "Textured weave linen blend engineered for warm weather draping.",
      details: ["Mother of pearl buttons", "Cuban camp collar"],
      fabricCare: ["Dry clean recommended"],
      fit: "Relaxed Fit",
      totalStock: 60,
      lowStockThreshold: 8,
    };

    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });
});
