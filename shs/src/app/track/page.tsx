import { Suspense } from "react";
import { TrackView } from "@/views/book";
import { meta } from "@/lib/seo";

export const metadata = meta("Track Your Booking", "Check the status of your home-service booking using your booking ID and mobile number.", "/track", { noindex: true });

export default function Page() { return <Suspense><TrackView /></Suspense>; }
