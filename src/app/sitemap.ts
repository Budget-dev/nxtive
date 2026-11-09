import { MetadataRoute } from "next";
import { fetchStorefrontProducts, fetchStorefrontCategories, DEFAULT_CATEGORIES } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nxtive.in";
  const now = new Date();

  // Core static storefront pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/sustainability`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/press`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/affiliates`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  // Category landing pages (static + dynamic)
  const defaultSlugs = [
    "t-shirts",
    "shirts",
    "hoodies",
    "bottoms",
    "jackets",
    "new-arrivals",
    "urban-essentials",
    "premium-basics",
  ];

  let dynamicCategories: string[] = [];
  try {
    const fetchedCategories = await fetchStorefrontCategories();
    dynamicCategories = fetchedCategories.map((c) => c.slug).filter(Boolean);
  } catch {
    dynamicCategories = DEFAULT_CATEGORIES.map((c) => c.slug);
  }

  const allCategorySlugs = Array.from(new Set([...defaultSlugs, ...dynamicCategories]));

  const categoryPages: MetadataRoute.Sitemap = allCategorySlugs.map((slug) => ({
    url: `${baseUrl}/categories/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic Product pages from catalog
  const catalogProducts = await fetchStorefrontProducts();
  const productPages: MetadataRoute.Sitemap = catalogProducts.map((prod) => ({
    url: `${baseUrl}/products/${prod.slug || prod.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
