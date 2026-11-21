import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/staff-portal", "/track", "/login"] }, sitemap: `${SITE}/sitemap.xml` };
}
