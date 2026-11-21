import { AdminView } from "@/views/admin";
import { meta } from "@/lib/seo";

export const metadata = meta("Admin Dashboard", "Admin", "/admin", { noindex: true });

export default function Page() { return <AdminView />; }
