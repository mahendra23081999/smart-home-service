import { ContactView } from "@/views/public";
import { meta } from "@/lib/seo";

export const metadata = meta("Contact Us", "Call, WhatsApp or send us a message about home services in Gujarat.", "/contact-us");

export default function Page() { return <ContactView />; }
