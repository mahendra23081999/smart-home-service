import { ServicesView } from "@/views/public";
import { meta, JsonLd, breadcrumbLd } from "@/lib/seo";

export const metadata = meta("All Home Services — Maids, Cooks, Nannies, Caregivers & Drivers", "Browse all home services: maids, cooks, babysitters, japa maids, elderly care, patient care, drivers and office staff across Gujarat.", "/services");

export default function Page() { return <><JsonLd data={breadcrumbLd([["Services", "/services"]])} /><ServicesView /></>; }
