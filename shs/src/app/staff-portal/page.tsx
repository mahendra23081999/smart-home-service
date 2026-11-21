import { StaffPortalView } from "@/views/account";
import { meta } from "@/lib/seo";

export const metadata = meta("Staff Login", "Registered professionals can check verification progress, update availability and view assigned work.", "/staff-portal", { noindex: true });

export default function Page() { return <StaffPortalView />; }
