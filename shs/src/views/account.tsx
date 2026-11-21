"use client";
import { useState } from "react";
import Link from "next/link";
import { DUTY, LANGS, ST_COLOR, STAFF_COLOR, VER_ITEMS, emptyVer, uid, today, type Booking } from "@/lib/data";
import { useStore } from "@/lib/store";
import { activeSvcs, cityName, dutyName, fmtDate, fmtDT, inr, normPhone, otp, svcBy, svcName, V } from "@/lib/utils";
import { Ic, StarIc } from "@/components/art";
import { Badge, BookingStatusCard, CityArea, Field, FieldWrap, Form, Loading, PageHead, ProCard, Stars, type Errs } from "@/components/blocks";

export const copyText = (t: string, toast: (m: string) => void) => { try { navigator.clipboard.writeText(t).then(() => toast("Copied"), () => toast("Copy not available — select and copy manually.")); } catch { toast("Copy not available — select and copy manually."); } };

/* ============ LOGIN (OTP demo) ============ */
export function LoginView() {
  const { S, ready, update, toast, go } = useStore();
  const [O, setO] = useState<{ phone: string; name: string; code: string; tries: number } | null>(null);
  if (!ready) return <Loading />;
  if (S.user) return <DashboardView />;
  return <>
    <PageHead title="Login / Register" sub="Sign in with your mobile number — no password needed." cr={[[null, "Login"]]} />
    <section className="sec"><div className="container" style={{ maxWidth: 520 }}>
      <Form key={O ? "otp" : "phone"} className="card pad" onData={d => {
        if (!O) { if (!V.phone(d.phone || "")) return { phone: 1 }; setO({ phone: normPhone(d.phone), name: (d.name || "").trim(), code: otp(), tries: 0 }); return; }
        if (d.otp !== O.code) { const tries = O.tries + 1; if (tries >= 5) { setO(null); toast("Too many attempts. Please request a new OTP."); return; } setO({ ...O, tries }); return { otp: 1 }; }
        update(s => {
          const c = s.customers[O.phone] || { phone: O.phone, name: O.name || "Customer", email: "", addresses: [], created: new Date().toISOString() };
          if (O.name) c.name = O.name; c.ref ||= "REF" + c.phone.slice(-4) + Math.random().toString(36).slice(2, 4).toUpperCase();
          s.customers[O.phone] = c; s.user = { phone: c.phone, name: c.name, email: c.email, addresses: c.addresses, ref: c.ref };
        });
        setO(null); toast("Signed in successfully"); go("/dashboard");
      }}>
        {!O ? <><h3>Welcome</h3><p className="muted small">We&apos;ll send a one-time password to verify your number.</p>
          <Field name="name" label="Full name (for new accounts)" ph="Your name" />
          <Field name="phone" label="Mobile number" type="tel" req ph="10-digit mobile" inputMode="numeric" maxLength={14} err="Enter a valid 10-digit Indian mobile number" />
          <button className="btn btn-primary btn-block">Send OTP</button></>
          : <><h3>Enter OTP</h3><p className="muted small">Sent to +91 {O.phone}. <button type="button" className="link" onClick={() => setO(null)}>Change number</button></p>
            <div className="note info" style={{ marginBottom: 14 }}><Ic n="lock" s={18} /><div><b>Demo mode:</b> no SMS is sent. Your OTP is <span className="otp-demo">{O.code}</span><br /><span className="small">With a backend, this is delivered by an SMS gateway (e.g. MSG91 / Twilio) and never shown on screen.</span></div></div>
            <Field name="otp" label="6-digit OTP" req inputMode="numeric" maxLength={6} autoComplete="one-time-code" err="Incorrect OTP" />
            <button className="btn btn-primary btn-block">Verify & continue</button></>}
      </Form>
      <p className="muted small" style={{ textAlign: "center", marginTop: 14 }}>Are you a professional? <Link className="link" href="/staff-portal">Staff login</Link> · <Link className="link" href="/staff-registration">Register as staff</Link></p>
    </div></section>
  </>;
}

/* ============ CUSTOMER DASHBOARD ============ */
export function DashboardView() {
  const { S, ready, update, toast, openModal, closeModal, startBooking, openWA, go } = useStore();
  const [tab, setTab] = useState("bookings");
  if (!ready) return <Loading />;
  if (!S.user) return <LoginView />;
  const U = S.user;
  const mine = S.bookings.filter(b => b.phone === U.phone);
  const upcoming = mine.filter(b => !["Completed", "Cancelled"].includes(b.status));
  const tabs: [string, string, string, number?][] = [["bookings", "My bookings", "cal", upcoming.length], ["shortlist", "Shortlisted professionals", "users"], ["reviews", "Reviews & ratings", "star"], ["support", "Support tickets", "headset"], ["notifications", "Notifications", "bell"], ["profile", "Profile & addresses", "user"], ["referral", "Refer & earn", "gift"]];
  const note = (id: string, t: string, patch: Partial<Booking>) => update(s => { const b = s.bookings.find(x => x.id === id)!; Object.assign(b, patch); b.internal.push({ at: new Date().toISOString(), by: "Customer", t }); });

  const cancel = (id: string) => openModal("Request cancellation", <Form onData={d => { note(id, "Cancellation requested: " + (d.reason || "no reason given"), { cancelReq: true, cancelReason: d.reason }); closeModal(); toast("Cancellation request sent to our team."); }}>
    <p className="muted">Our team will confirm the cancellation. Any charges follow our <Link className="link" href="/cancellation-policy" target="_blank">Cancellation Policy</Link>.</p>
    <Field name="reason" label="Reason (optional)" type="textarea" /><button className="btn btn-red btn-block">Send cancellation request</button></Form>);
  const replace = (id: string) => openModal("Request replacement", <Form onData={d => { note(id, "Replacement requested: " + (d.rr || ""), { replaceReq: true }); closeModal(); toast("Replacement request sent."); }}>
    <p className="muted">Replacements are arranged as per our <Link className="link" href="/replacement-policy" target="_blank">Replacement Policy</Link>.</p>
    <Field name="rr" label="What isn't working?" type="textarea" /><button className="btn btn-primary btn-block">Request replacement</button></Form>);
  const review = (id: string) => openModal("Review your service", <ReviewForm id={id} />);
  const invoice = (b: Booking) => {
    const s = S.settings; const c = S.coupons.find(x => x.code === b.coupon);
    const rows: [string, string][] = [["Booking ID", b.id], ["Date", fmtDate(b.created)], ["Customer", `${b.name} (+91 ${b.phone})`], ["Address", b.address || "—"], ["Service", svcName(S, b.service) + (b.extra?.length ? " + " + b.extra.map(x => svcName(S, x)).join(", ") : "")], ["Duty type", dutyName(b.duty)], ["Schedule", `from ${fmtDate(b.date)} · ${(b.days || []).join(", ")} ${b.duty !== "live-in" && b.start ? b.start + "–" + b.end : ""}`], ["Responsibilities", b.resp || "As agreed"], ["Status", b.status], ["Amount paid", inr(b.amountPaid)], ...(c ? [["Coupon", c.code] as [string, string]] : [])];
    const txt = `${s.brand} — Booking Confirmation & Service Agreement\n` + rows.map(([k, v]) => `${k}: ${v}`).join("\n");
    openModal("Booking confirmation & agreement", <div style={{ fontSize: 14 }}><div className="h-sec"><div><b style={{ fontFamily: "var(--fh)", fontSize: 18, color: "var(--navy)" }}>{s.brand}</b><div className="muted small">{s.address || "Business address"}</div></div><Badge st={b.status} /></div>
      <table className="sumtbl"><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
      <div className="note info" style={{ marginTop: 14 }}><Ic n="doc" s={18} /><div className="small">GST invoices and e-signed agreements need a backend to generate PDFs. Here you can copy or print the confirmation.</div></div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => copyText(txt, toast)}><Ic n="copy" s={16} /> Copy</button><button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => window.print()}><Ic n="doc" s={16} /> Print</button></div></div>);
  };
  const pay = () => openModal("Pay booking fee", <><p>Pay securely with UPI, cards, net banking or wallets.</p><div className="grid g2" style={{ gap: 10, margin: "14px 0" }}>{["UPI (GPay, PhonePe, Paytm)", "Credit / Debit card", "Net banking", "Wallets"].map(x => <div key={x} className="card" style={{ padding: 14, fontWeight: 500 }}>{x}</div>)}</div><div className="note warn"><Ic n="lock" s={18} /><div className="small">Online payments need a server to create Razorpay orders and verify signatures, so they are switched off in this frontend-only build. Our team will share payment details on call.</div></div><button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={closeModal}>Close</button></>);

  const act = (b: Booking) => <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
    {!["Completed", "Cancelled"].includes(b.status) && !b.cancelReq && <button className="btn btn-red btn-sm" onClick={() => cancel(b.id)}>Request cancellation</button>}
    {b.status === "Service Started" && !b.replaceReq && <button className="btn btn-ghost btn-sm" onClick={() => replace(b.id)}><Ic n="refresh" s={15} /> Request replacement</button>}
    {b.status === "Completed" && !b.reviewed && <button className="btn btn-primary btn-sm" onClick={() => review(b.id)}><Ic n="star" s={15} /> Write a review</button>}
    <button className="btn btn-ghost btn-sm" onClick={() => invoice(b)}><Ic n="doc" s={15} /> Invoice / agreement</button>
    <button className="btn btn-ghost btn-sm" onClick={() => startBooking({ service: b.service, city: b.city, area: b.area, duty: b.duty })}><Ic n="refresh" s={15} /> Book again</button>
    {["Booking Confirmed", "Service Started"].includes(b.status) && !b.amountPaid && <button className="btn btn-green btn-sm" onClick={pay}><Ic n="rupee" s={15} /> Pay booking fee</button>}
  </div>;

  let body: React.ReactNode = null;
  if (tab === "bookings") body = <><div className="h-sec"><h2>My bookings</h2><button className="btn btn-primary btn-sm" onClick={() => startBooking()}><Ic n="plus" s={15} /> New booking</button></div>
    {mine.length ? <><h4 className="muted">Upcoming & active ({upcoming.length})</h4>{upcoming.length ? upcoming.map(b => <BookingStatusCard key={b.id} b={b} actions={act(b)} />) : <p className="muted">None.</p>}
      <h4 className="muted" style={{ marginTop: 26 }}>History</h4>{mine.filter(b => !upcoming.includes(b)).map(b => <BookingStatusCard key={b.id} b={b} actions={act(b)} />)}{mine.length === upcoming.length && <p className="muted">No past bookings yet.</p>}</>
      : <div className="card empty"><Ic n="cal" s={40} /><p>No bookings yet for +91 {U.phone}.</p><button className="btn btn-primary" onClick={() => startBooking()}>Book a service</button></div>}</>;
  if (tab === "shortlist") { const ids = [...new Set(mine.flatMap(b => [...(b.shortlist || []), b.staff].filter(Boolean)))]; const ps = ids.map(i => S.staff.find(p => p.id === i)).filter(Boolean); body = <><h2>Shortlisted professionals</h2><p className="muted">Profiles our team has shortlisted for your bookings.</p>{ps.length ? <div className="grid g2">{ps.map(p => p && <ProCard key={p.id} p={p} />)}</div> : <div className="card empty"><Ic n="users" s={40} /><p>No shortlisted profiles yet. They appear here once our team shortlists professionals for your enquiry.</p></div>}</>; }
  if (tab === "reviews") { const mr = S.reviews.filter(r => r.phone === U.phone); const due = mine.filter(b => b.status === "Completed" && !b.reviewed); body = <><h2>Reviews & ratings</h2>
    {due.length > 0 && <div className="note info" style={{ marginBottom: 16 }}><Ic n="star" s={18} /><div>{due.length} completed booking(s) waiting for your review. {due.map(b => <button key={b.id} className="link" style={{ marginRight: 8 }} onClick={() => review(b.id)}>Review {svcName(S, b.service)}</button>)}</div></div>}
    {mr.length ? mr.map(r => <div key={r.id} className="card pad" style={{ marginBottom: 12 }}><div className="h-sec"><Stars n={r.rating} /><Badge st={r.status === "approved" ? "Published" : r.status === "pending" ? "Awaiting approval" : "Not published"} map={{ Published: "#0f8a72", "Awaiting approval": "#c26a0a", "Not published": "#64748b" }} /></div><p style={{ margin: 0 }}>{r.text}</p></div>) : <p className="muted">You can review a booking once it is marked Completed.</p>}</>; }
  if (tab === "support") { const tk = S.tickets.filter(x => x.phone === U.phone); body = <><div className="h-sec"><h2>Support tickets</h2></div>
    <Form className="card pad" style={{ marginBottom: 18 }} onData={(d, f) => { const er: Errs = {}; if (!V.req(d.subject)) er.subject = 1; if (!V.req(d.msg)) er.msg = 1; if (Object.keys(er).length) return er; update(s => { s.tickets.unshift({ id: "TK-" + Math.random().toString(36).slice(2, 7).toUpperCase(), phone: U.phone, name: U.name, booking: d.booking, subject: d.subject, msg: d.msg, status: "Open", at: new Date().toISOString() }); }); f.reset(); toast("Ticket raised — our team will respond soon."); }}>
      <div className="frow"><Field name="booking" label="Related booking" type="select" opts={mine.map(b => [b.id, b.id + " · " + svcName(S, b.service)])} placeholder="General query" /><Field name="subject" label="Subject" req err="Enter a subject" /></div>
      <Field name="msg" label="Describe the issue" type="textarea" req err="Please describe the issue" /><button className="btn btn-primary">Raise ticket</button></Form>
    {tk.map(x => <div key={x.id} className="card pad" style={{ marginBottom: 10 }}><div className="h-sec"><b style={{ color: "var(--navy)" }}>{x.subject}</b><Badge st={x.status} map={{ Open: "#c26a0a", Resolved: "#0f8a72" }} /></div><p className="small" style={{ margin: 0 }}>{x.msg}</p><p className="muted small" style={{ margin: "6px 0 0" }}>{x.id} · {fmtDT(x.at)}{x.booking ? " · " + x.booking : ""}</p>{x.reply && <div className="note ok" style={{ marginTop: 10 }}><Ic n="headset" s={16} /><div className="small"><b>Support:</b> {x.reply}</div></div>}</div>)}</>; }
  if (tab === "notifications") { const ev = mine.flatMap(b => b.history.map(h => ({ b, h }))).sort((a, c) => c.h.at.localeCompare(a.h.at)); body = <><h2>Notifications</h2>{ev.length ? <div className="card">{ev.map(({ b, h }, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}><span style={{ color: ST_COLOR[h.s] }}><Ic n="bell" s={18} /></span><div><b style={{ color: "var(--navy)" }}>{h.s}</b> — {svcName(S, b.service)} ({b.id})<div className="muted small">{fmtDT(h.at)}</div></div></div>)}</div> : <p className="muted">No notifications yet.</p>}</>; }
  if (tab === "profile") { const c = S.customers[U.phone] || { email: "", addresses: [] as string[] }; body = <><h2>Profile & saved addresses</h2>
    <Form className="card pad" onData={(d, f) => { const er: Errs = {}; if (!V.name(d.name)) er.name = 1; if (!V.email(d.email)) er.email = 1; if (Object.keys(er).length) return er; update(s => { const cc = s.customers[U.phone] ||= { name: U.name, phone: U.phone, email: "", addresses: [], created: new Date().toISOString() }; cc.name = d.name.trim(); cc.email = d.email.trim(); if (d.newaddr.trim()) cc.addresses.push(d.newaddr.trim()); s.user = { ...U, name: cc.name, email: cc.email, addresses: cc.addresses }; }); (f.elements.namedItem("newaddr") as HTMLTextAreaElement).value = ""; toast("Profile saved"); }}>
      <div className="frow"><Field name="name" label="Full name" value={U.name} req err="Enter your name" /><Field name="email" label="Email" type="email" value={c.email} err="Enter a valid email" /></div>
      <Field name="phone_ro" label="Mobile (verified)" value={"+91 " + U.phone} disabled />
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#3b4b5e" }}>Saved addresses</label>
      <div style={{ display: "grid", gap: 8, margin: "8px 0 14px" }}>{c.addresses.length ? c.addresses.map((a, i) => <div key={i} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><span className="small"><Ic n="map" s={15} /> {a}</span><button type="button" className="xbtn" aria-label="Remove address" onClick={() => update(s => { const cc = s.customers[U.phone]; cc.addresses.splice(i, 1); if (s.user) s.user.addresses = cc.addresses; })}><Ic n="trash" s={15} /></button></div>) : <span className="muted small">No saved addresses.</span>}</div>
      <Field name="newaddr" label="Add an address" type="textarea" ph="Flat, society, area, city" /><button className="btn btn-primary">Save profile</button></Form></>; }
  if (tab === "referral") body = <><h2>Refer & earn</h2><div className="card pad"><p>Share your referral code with friends. When their booking is completed, you receive discount credit{S.settings.referralCredit ? <> of <b>{inr(S.settings.referralCredit)}</b></> : ""} as per the referral terms.</p>
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><span className="otp-demo" style={{ background: "var(--bg)", padding: "10px 18px", borderRadius: 12 }}>{U.ref}</span><button className="btn btn-ghost btn-sm" onClick={() => copyText(U.ref, toast)}><Ic n="copy" s={15} /> Copy code</button><button className="btn btn-wa btn-sm" onClick={() => openWA(`Book trusted home help with ${S.settings.brand}. Use my code ${U.ref}.`)}>Share on WhatsApp</button></div>
    {!S.settings.referralCredit && <p className="muted small" style={{ marginTop: 12 }}>Referral reward amount is configured in Admin → Marketing.</p>}</div></>;

  return <>
    <PageHead title={`Hello, ${U.name.split(" ")[0]}`} sub="Manage your bookings, professionals, reviews and support in one place." cr={[[null, "My Dashboard"]]} />
    <section className="sec"><div className="container dash"><nav className="side">{tabs.map(([k, l, i, c]) => <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}><Ic n={i} s={18} /> {l}{c ? <span className="cnt">{c}</span> : null}</button>)}<button onClick={() => { update(s => { s.user = null; }); go("/"); }}><Ic n="logout" s={18} /> Log out</button></nav><div>{body}</div></div></section>
  </>;
}

function ReviewForm({ id }: { id: string }) {
  const { S, update, closeModal, toast } = useStore();
  const [r, setR] = useState(5); const b = S.bookings.find(x => x.id === id);
  if (!b) return null;
  return <Form onData={d => {
    if ((d.text || "").trim().length < 20) return { text: 1 };
    update(s => {
      s.reviews.unshift({ id: uid("r"), name: d.photo ? (b.name || "Customer").split(" ")[0] : "Verified customer", city: cityName(s, b.city), service: b.service, rating: r, text: d.text.trim(), status: "pending", phone: b.phone, booking: id, date: today() });
      const bb = s.bookings.find(x => x.id === id)!; bb.reviewed = true; if (bb.staff) s.staff.find(x => x.id === bb.staff)?.ratings.push(r);
    });
    closeModal(); toast("Thanks! Your review will appear after admin approval.");
  }}>
    <p className="muted">{svcName(S, b.service)} · {cityName(S, b.city)}</p>
    <label style={{ fontSize: 12.5, fontWeight: 600 }}>Your rating</label>
    <div className="rating-in" style={{ margin: "6px 0 14px" }}>{[1, 2, 3, 4, 5].map(i => <button type="button" key={i} className={i <= r ? "on" : ""} onClick={() => setR(i)} aria-label={`${i} stars`}><StarIc s={28} /></button>)}</div>
    <Field name="text" label="Your review" type="textarea" req err="Please write at least 20 characters" />
    <label className="check"><input type="checkbox" name="photo" /> <span>I&apos;m happy for my first name and city to be shown with my review.</span></label>
    <button className="btn btn-primary btn-block" style={{ marginTop: 14 }}>Submit for approval</button>
  </Form>;
}

/* ============ STAFF REGISTRATION ============ */
export function StaffRegView() {
  const { S, update, toast, openModal, closeModal, go } = useStore();
  const [k, setK] = useState(0);
  return <>
    <PageHead title="Join as a Professional" sub="Register to get matched with families near you. Your phone number, address and documents are kept private and used only for verification." cr={[[null, "Staff Registration"]]} />
    <section className="sec"><div className="container split">
      <Form key={k} className="card pad" onData={d => {
        const er: Errs = {};
        if (!V.name(d.name)) er.name = 1; if (!(+d.age >= 18 && +d.age <= 70)) er.age = 1; if (!V.phone(d.phone)) er.phone = 1; if (!d.city) er.city = 1; if (!V.req(d.paddr)) er.paddr = 1; if (!d.service) er.service = 1; if (d.exp === "" || +d.exp < 0) er.exp = 1; if (!(d.langs || []).length) er.langs = 1; if (!V.req(d.skills)) er.skills = 1; if (!(d.duty || []).length) er.duty = 1; if (!V.req(d.emg)) er.emg = 1; if (!V.req(d.ref)) er.ref = 1; if (!d.iddoc) er.iddoc = 1; if (!d.consent) er.consent = 1;
        if (Object.keys(er).length) { toast("Please complete the highlighted fields."); return er; }
        const ph = normPhone(d.phone); if (S.staff.find(p => p.phone === ph)) { toast("This number is already registered. Use Staff login."); return { phone: 1 }; }
        const sv = svcBy(S, d.service)!;
        update(s => { s.staff.push({ id: uid("pro-"), name: d.name.trim().split(" ")[0], fullName: d.name.trim(), role: sv.name.replace(" Service", ""), group: sv.group, services: [d.service], exp: +d.exp, skills: d.skills.split(",").map((x: string) => x.trim()).filter(Boolean), langs: d.langs, hours: "To be confirmed", duty: d.duty, city: d.city, area: d.area || cityName(s, d.city), gender: d.gender, age: +d.age, status: "Pending", ver: emptyVer(), published: false, phone: ph, paddr: d.paddr, salary: d.salary, prev: d.prev, emg: d.emg, ref: d.ref, iddocName: d.iddoc, ratings: [], about: "", registered: new Date().toISOString() }); });
        setK(k + 1);
        openModal("Registration received", <div style={{ textAlign: "center" }}><div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--green-l)", color: "var(--green)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Ic n="check" s={32} sw={2.4} /></div><h3>Thank you, {d.name.split(" ")[0]}!</h3><p className="muted">Your status is <b>Pending</b>. Our team will call you to schedule verification and an interview. You can check progress any time from Staff login.</p><button className="btn btn-primary" onClick={() => { closeModal(); go("/staff-portal"); }}>Go to staff login</button></div>);
      }}>
        <h3>Personal details</h3>
        <div className="frow"><Field name="name" label="Full name" req err="Enter your full name" /><Field name="photo" label="Profile photograph" type="file" accept="image/*" hint="Clear face photo, plain background" /></div>
        <div className="frow3"><Field name="age" label="Age" type="number" min={18} max={70} req err="You must be 18 or older" hint="Must be 18+" /><Field name="gender" label="Gender" type="select" opts={["Female", "Male", "Other", "Prefer not to say"]} /><Field name="phone" label="Mobile number" type="tel" req err="Enter a valid 10-digit mobile number" /></div>
        <div className="frow"><CityArea cityLabel="Current city" areaLabel="Preferred locality" req cityErr="Select your city" /></div>
        <Field name="paddr" label="Permanent address" type="textarea" req err="Enter your permanent address" />
        <h3 style={{ marginTop: 10 }}>Work details</h3>
        <div className="frow"><Field name="service" label="Preferred job category" type="select" opts={activeSvcs(S).map(s => [s.slug, s.name])} req err="Choose a job category" /><Field name="exp" label="Work experience (years)" type="number" min={0} max={50} req err="Enter years of experience" /></div>
        <FieldWrap name="langs" label="Languages" req err="Select at least one language"><div className="days">{LANGS.map(l => <label key={l}><input type="checkbox" name="langs" data-multi value={l} /><span>{l}</span></label>)}</div></FieldWrap>
        <Field name="skills" label="Skills" ph="e.g. Gujarati cooking, Jain food, infant care, ironing" req err="List at least one skill" hint="Separate with commas" />
        <div className="frow"><Field name="salary" label="Expected salary (₹/month)" type="number" min={0} /><FieldWrap name="duty" label="Preferred duty type" req err="Select at least one"><div className="days">{DUTY.map(d => <label key={d.k}><input type="checkbox" name="duty" data-multi value={d.k} /><span>{d.n.replace(" Service", "")}</span></label>)}</div></FieldWrap></div>
        <Field name="prev" label="Previous employment" type="textarea" ph="Family / employer, city, duration, reason for leaving" />
        <h3 style={{ marginTop: 10 }}>Emergency contact & references</h3>
        <div className="frow"><Field name="emg" label="Emergency contact (name & number)" req err="Enter an emergency contact" /><Field name="ref" label="Reference (name & number)" req err="Enter at least one reference" /></div>
        <h3 style={{ marginTop: 10 }}>Identity verification</h3>
        <Field name="iddoc" label="Identity document (Aadhaar / Voter ID / Driving licence)" type="file" accept="image/*,.pdf" req err="Upload an identity document" hint="Only the file name is recorded in this frontend-only build — the file itself is not uploaded or stored. Documents need secure server storage." />
        <label className="check"><input type="checkbox" name="consent" /> <span>I consent to identity, reference and police verification, and confirm the details above are true.</span></label>
        <FieldWrap name="consent" err="Consent is required for verification" />
        <button className="btn btn-primary btn-block" style={{ marginTop: 10 }}>Submit registration</button>
      </Form>
      <aside className="sticky"><div className="card pad"><h4>What happens next</h4><ul className="stl">{["Pending review", "Document & identity verification", "Police verification & reference checks", "In-person interview & skills assessment", "Approved — profile goes live"].map((s, i) => <li key={s} className={i === 0 ? "cur" : ""}><span className="sd">{i + 1}</span><div className="small">{s}</div></li>)}</ul></div>
        <div className="note info" style={{ marginTop: 16 }}><Ic n="lock" s={18} /><div className="small">Only your first name, role, experience, skills, languages and locality appear on your public profile.</div></div>
        <p className="small muted" style={{ marginTop: 14 }}>Already registered? <Link className="link" href="/staff-portal">Staff login</Link></p></aside>
    </div></section>
  </>;
}

/* ============ STAFF PORTAL ============ */
export function StaffPortalView() {
  const { S, ready, update, toast } = useStore();
  const [O, setO] = useState<{ id: string; code: string } | null>(null);
  if (!ready) return <Loading />;
  const p = S.staffUser ? S.staff.find(x => x.id === S.staffUser) : undefined;
  if (!p) return <>
    <PageHead title="Staff Login" sub="For registered professionals: check verification progress, update availability and view assigned work." cr={[[null, "Staff Login"]]} />
    <section className="sec"><div className="container" style={{ maxWidth: 520 }}>
      <Form key={O ? "o" : "p"} className="card pad" onData={d => {
        if (!O) { const ph = normPhone(d.phone || ""); const x = S.staff.find(s => s.phone && s.phone === ph); if (!x) { toast("No professional registered with this number."); return { phone: 1 }; } setO({ id: x.id, code: otp() }); return; }
        if (d.otp !== O.code) return { otp: 1 };
        update(s => { s.staffUser = O.id; }); setO(null);
      }}>
        {!O ? <><Field name="phone" label="Registered mobile number" type="tel" req err="Enter your registered 10-digit number" /><button className="btn btn-primary btn-block">Send OTP</button><p className="muted small" style={{ marginTop: 12 }}>Demo profiles have no phone number. Register a new professional to try this flow.</p></>
          : <><div className="note info" style={{ marginBottom: 14 }}><Ic n="lock" s={18} /><div><b>Demo OTP:</b> <span className="otp-demo">{O.code}</span></div></div><Field name="otp" label="OTP" req err="Incorrect OTP" /><button className="btn btn-primary btn-block">Verify</button></>}
      </Form>
      <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>Not registered? <Link className="link" href="/staff-registration">Join as a professional</Link></p>
    </div></section>
  </>;
  const jobs = S.bookings.filter(b => b.staff === p.id); const live = ["Approved", "Available", "Assigned", "Unavailable"].includes(p.status);
  const avail = (st: string) => { update(s => { s.staff.find(x => x.id === p.id)!.status = st; }); toast("Availability updated"); };
  const earned = jobs.reduce((a, b) => a + (+b.amountPaid || 0), 0);
  return <>
    <PageHead title={`Hello, ${p.name}`} sub={`${p.role} · ${cityName(S, p.city)}`} cr={[[null, "Staff Portal"]]} />
    <section className="sec"><div className="container split"><div>
      <div className="card pad" style={{ marginBottom: 18 }}><div className="h-sec"><h3>Your status</h3><Badge st={p.status} map={STAFF_COLOR} /></div>
        {live ? <><p className="muted small">Update your availability so our team knows when to share your profile.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className={"btn " + (p.status === "Available" ? "btn-green" : "btn-ghost")} onClick={() => avail("Available")}>Available</button><button className={"btn " + (p.status === "Unavailable" ? "btn-navy" : "btn-ghost")} onClick={() => avail("Unavailable")}>Unavailable</button></div></> : <p className="muted small">Availability can be updated once your profile is approved.</p>}</div>
      <div className="kpis"><div className="card kpi"><span><Ic n="brief" s={15} /> Assignments</span><b>{jobs.length}</b></div><div className="card kpi"><span><Ic n="check" s={15} /> Completed</span><b>{jobs.filter(j => j.status === "Completed").length}</b></div><div className="card kpi"><span><Ic n="rupee" s={15} /> Fees recorded</span><b>{inr(earned)}</b></div></div>
      <div className="card pad"><h3>Assigned work</h3>{jobs.length ? jobs.map(b => <div key={b.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}><div className="h-sec" style={{ margin: 0 }}><b style={{ color: "var(--navy)" }}>{svcName(S, b.service)}</b><Badge st={b.status} /></div><div className="small muted">{b.area}, {cityName(S, b.city)} · {dutyName(b.duty)} · from {fmtDate(b.date)}{b.start ? ` · ${b.start}–${b.end}` : ""}</div><div className="small">Customer contact is shared by our team before joining.</div></div>) : <p className="muted">No assignments yet.</p>}</div>
    </div><aside className="sticky"><div className="card pad"><h4>Verification progress</h4><ul className="stl">{VER_ITEMS.map(([k, l]) => { const v = p.ver[k]; return <li key={k} className={v === "Done" ? "done" : v === "In progress" ? "cur" : ""}><span className="sd">{v === "Done" ? <Ic n="check" s={14} sw={2.6} /> : null}</span><div className="small"><b>{l}</b> — {v}</div></li>; })}</ul>
      <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => update(s => { s.staffUser = null; })}><Ic n="logout" s={16} /> Log out</button></div></aside></div></section>
  </>;
}
