import type { Metadata } from "next";
import { ProView } from "@/views/public";
import { STAFF_SEED, CITIES } from "@/lib/data";
import { meta } from "@/lib/seo";

type P = { params: Promise<{ id: string }> };
export const generateStaticParams = () => STAFF_SEED.map(p => ({ id: p.id }));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params; const p = STAFF_SEED.find(x => x.id === id);
  // Sample profiles are not indexed. Index real profiles only with the professional's consent.
  if (!p) return meta("Professional profile", "Verified domestic professional", `/professionals/${id}`, { noindex: true });
  return meta(`${p.name} — ${p.role} in ${CITIES.find(c => c.slug === p.city)?.name}`, `${p.role} with ${p.exp} years of experience in ${p.area}.`, `/professionals/${id}`, { noindex: !!p.demo });
}

export default async function Page({ params }: P) { const { id } = await params; return <ProView id={id} />; }
