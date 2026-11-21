import type { Metadata } from "next";
import { ServiceDetailView } from "@/views/public";
import { SERVICES, serviceFaqs } from "@/lib/data";
import { meta, JsonLd, breadcrumbLd, serviceLd, faqLd } from "@/lib/seo";

type P = { params: Promise<{ slug: string }> };
export const generateStaticParams = () => SERVICES.map(s => ({ slug: s.slug }));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params; const s = SERVICES.find(x => x.slug === slug);
  if (!s) return meta("Service", "Home services in Gujarat", `/services/${slug}`, { noindex: true });
  return meta(s.seoTitle || `${s.name} in Ahmedabad & Gujarat — Verified Staff`, s.seoDesc || `${s.short} Book verified ${s.name.toLowerCase()} in Ahmedabad, Surat, Vadodara and across Gujarat.`, `/services/${s.slug}`);
}

export default async function Page({ params }: P) {
  const { slug } = await params; const s = SERVICES.find(x => x.slug === slug);
  return <>
    {s && <JsonLd data={[breadcrumbLd([["Services", "/services"], [s.name, `/services/${s.slug}`]]), serviceLd(s.name, s.short, "Gujarat, India", `/services/${s.slug}`), faqLd(serviceFaqs(s.name, ""))]} />}
    <ServiceDetailView slug={slug} />
  </>;
}
