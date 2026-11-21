import { PricingView } from "@/views/public";
import { meta } from "@/lib/seo";

export const metadata = meta("Pricing & Plans", "Transparent pricing for maids, cooks, nannies, caregivers and drivers. Hourly, part-time, full-time and live-in plans.", "/pricing");

export default function Page() { return <PricingView />; }
