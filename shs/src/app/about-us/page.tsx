import { AboutView } from "@/views/public";
import { meta, JsonLd, breadcrumbLd } from "@/lib/seo";

export const metadata = meta("About Us", "A home-services company connecting Gujarat families with verified domestic professionals — maids, cooks, nannies, caregivers and drivers.", "/about-us");

export default function Page() { return <><JsonLd data={breadcrumbLd([["About Us", "/about-us"]])} /><AboutView /></>; }
