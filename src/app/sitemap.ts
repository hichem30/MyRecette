import type { MetadataRoute } from "next";
import { getAllCategories, getAllProducts } from "@/lib/data";

export const revalidate = 60;

const STATIC_PATHS = [
  "",
  "/products",
  "/categories",
  "/deals",
  "/about",
  "/contact",
  "/wishlist",
  "/login",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shop.redbarnmarket.workers.dev";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1.0 : 0.7,
    });
  }

  try {
    const [products, categories] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
    ]);
    for (const c of categories) {
      entries.push({
        url: `${base}/categories/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const p of products) {
      entries.push({
        url: `${base}/products/${p.slug}`,
        lastModified: p.created_at ? new Date(p.created_at) : now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    /* if data layer fails, return only static entries */
  }

  return entries;
}
