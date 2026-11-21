import { BlogView } from "@/views/public";
import { meta } from "@/lib/seo";

export const metadata = meta("Blog — Hiring Guides & Home Care Tips", "Guides on hiring maids, cooks, japa maids and caregivers for Indian families.", "/blog");

export default function Page() { return <BlogView />; }
