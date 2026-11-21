import { LoginView } from "@/views/account";
import { meta } from "@/lib/seo";

export const metadata = meta("Login or Register", "Login with your mobile number and OTP to manage bookings.", "/login", { noindex: true });

export default function Page() { return <LoginView />; }
