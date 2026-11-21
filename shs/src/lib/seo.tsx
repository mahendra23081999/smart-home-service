import type { Metadata } from "next";
import { BRAND, SITE } from "./site";

/** Build page metadata with canonical URL, Open Graph and Twitter cards. */
export function meta(title: string, description: string, path: string, opts: { noindex?: boolean; type?: "website" | "article" } = {}): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: BRAND, type: opts.type || "website", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const breadcrumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: [["Home", "/"], ...items].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + path })),
});
export const serviceLd = (name: string, description: string, area: string, path: string) => ({
  "@context": "https://schema.org", "@type": "Service", name, description, serviceType: name, url: SITE + path,
  provider: { "@type": "Organization", name: BRAND, url: SITE }, areaServed: area,
});
export const faqLd = (list: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: list.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
