import { DashboardView } from "@/views/account";
import { meta } from "@/lib/seo";

export const metadata = meta("My Dashboard", "Manage bookings, shortlisted professionals, reviews and support.", "/dashboard", { noindex: true });

export default function Page() { return <DashboardView />; }


