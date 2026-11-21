import { FindView } from "@/views/public";
import { meta } from "@/lib/seo";

export const metadata = meta("Find Verified Domestic Professionals", "Filter verified maids, cooks, nannies, caregivers and drivers by profession, language, experience, locality and schedule.", "/find-professionals");

export default function Page() { return <FindView />; }
