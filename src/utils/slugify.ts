// Single-purpose helper: convert product/category names to URL slugs.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a unique order number */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `NXTIVE-${year}-${rand}`;
}

/** Generate a tracking number */
export function generateTrackingNumber(prefix = "EXP"): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-NXT-${rand}`;
}

/** Generate a unique SKU */
export function generateSKU(category: string, id: string): string {
  const cat = category.slice(0, 3).toUpperCase();
  const suffix = id.slice(-4).toUpperCase();
  return `NX-${cat}-${suffix}`;
}
