import { HomeView } from "@/views/public";
import { meta, JsonLd, faqLd } from "@/lib/seo";
import { FAQS } from "@/lib/data";

export const metadata = {
  ...meta("Trusted Maids, Cooks, Babysitters & Caregivers in Gujarat", "Book verified maids, cooks, babysitters, japa maids, elderly caretakers and drivers in Ahmedabad, Surat, Vadodara and across Gujarat. Interview before you hire.", "/"),
  title: { absolute: "Smart Home Service — Trusted Home Services & Verified Domestic Staff in Gujarat" },
};

export default function Page() {
  return <><JsonLd data={faqLd(FAQS)} /><HomeView /></>;
}
