import { LocationsView } from "@/views/public";
import { meta, JsonLd, breadcrumbLd } from "@/lib/seo";

export const metadata = meta("Our Locations — Home Services Across Gujarat", "Maids, cooks, babysitters and caregivers in Ahmedabad, Surat, Vadodara, Rajkot, Gandhinagar, Anand, Bhavnagar, Jamnagar, Bharuch and Mehsana.", "/locations");

export default function Page() { return <><JsonLd data={breadcrumbLd([["Locations", "/locations"]])} /><LocationsView /></>; }
