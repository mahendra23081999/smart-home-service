import { BookView } from "@/views/book";
import { meta } from "@/lib/seo";

export const metadata = meta("Book a Home Service", "Book a verified maid, cook, babysitter, caregiver or driver in a few simple steps.", "/book");

export default function Page() { return <BookView />; }
