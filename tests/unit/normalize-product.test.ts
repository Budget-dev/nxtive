import { describe, it, expect } from "vitest";
import { normalizeProduct } from "@/lib/catalog";

describe("normalizeProduct", () => {
  it("normalizes product price, originalPrice and variants correctly", () => {
    const rawData = {
      title: "Relaxed Shirt",
      slug: "relaxed-shirt",
      price: 599,
      originalPrice: 659,
      category: "Shirts",
      variants: [
        { sku: "RELA-XS-BLE", size: "XS", color: "blee", stock: 1, price: 599 },
        { sku: "RELA-S-BLE", size: "S", color: "blee", stock: 2, price: 599 },
      ],
      isActive: true,
    };

    const product = normalizeProduct("prod-1", rawData);
    expect(product).not.toBeNull();
    expect(product?.title).toBe("Relaxed Shirt");
    expect(product?.price).toBe(599);
    expect(product?.originalPrice).toBe(659);
    expect(product?.variants).toHaveLength(2);
    expect(product?.variants?.[0].price).toBe(599);
  });

  it("handles null or missing originalPrice cleanly", () => {
    const rawData = {
      title: "Standard Shirt",
      price: 499,
      originalPrice: "",
      category: "Shirts",
      isActive: true,
    };

    const product = normalizeProduct("prod-2", rawData);
    expect(product).not.toBeNull();
    expect(product?.price).toBe(499);
    expect(product?.originalPrice).toBeNull();
  });
});

