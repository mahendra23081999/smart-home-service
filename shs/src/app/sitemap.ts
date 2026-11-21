import type { MetadataRoute } from "next";
import { BLOG_SEED, CITIES, POL, SERVICES } from "@/lib/data";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const u = (p: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: SITE + p, lastModified: now, priority });
  return [
    u("/", 1),
    ...["/services", "/locations", "/find-professionals", "/book"].map(p => u(p, 0.9)),
    ...["/about-us", "/how-it-works", "/pricing", "/blog", "/contact-us", "/staff-registration"].map(p => u(p, 0.7)),
    ...SERVICES.map(s => u(`/services/${s.slug}`, 0.9)),
    ...CITIES.map(c => u(`/locations/${c.slug}`, 0.8)),
    ...SERVICES.flatMap(s => CITIES.map(c => u(`/${s.slug}-in-${c.slug}`, c.slug === "ahmedabad" ? 0.8 : 0.6))),
    ...BLOG_SEED.map(b => ({ url: `${SITE}/blog/${b.slug}`, lastModified: new Date(b.date), priority: 0.6 })),
    ...Object.keys(POL).map(k => u(`/${k}`, 0.3)),
  ];
}
