"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DUTY, GROUPS, LANGS, today, type Group } from "@/lib/data";
import { useStore, type Pref } from "@/lib/store";
import { activeSvcs, cityBy, cityName, dutyName, fmtDate, inr, normPhone, priceText, readForm, svcBy, svcName, V } from "@/lib/utils";
import { Ic } from "@/components/art";
import { BookingStatusCard, CityArea, Field, FieldWrap, Form, PageHead, SuccessBody, type Errs } from "@/components/blocks";

const WZ = ["Service", "Location", "Duty", "Requirements", "Schedule", "Your details", "Review"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BookView() {
  const { S, BK, setBK, toast, update, createBooking, openModal, closeModal, openWA } = useStore();
  const ref = useRef<HTMLFormElement>(null);
  // Leaving the page after a successful booking resets the wizard for next time.
  useEffect(() => () => setBK(b => b.done ? { step: 1, d: {}, done: null } : b), [setBK]);
  if (BK.done) return <><PageHead title="Booking received" cr={[[null, "Book a Service"]]} /><section className="sec"><div className="container" style={{ maxWidth: 820 }}><div className="card pad"><SuccessBody b={BK.done} full /></div></div></section></>;
  const d = BK.d, st = BK.step;
  const setD = (p: Pref) => setBK(b => ({ ...b, d: { ...b.d, ...p } }));
  const collect = (): Pref => { const f = ref.current ? readForm(ref.current) : {}; return { ...d, ...f }; };
  const back = () => { const nd = collect(); setBK(b => ({ ...b, d: nd, step: b.step - 1 })); window.scrollTo({ top: 0 }); };
  const svc = svcBy(S, d.service);
  const coupon = S.coupons.find(x => x.active && x.code === (d.coupon || "").toUpperCase());

  const onData = (f: Record<string, unknown>): Errs | void => {
    const n: Pref = { ...d, ...(f as Pref) }; const er: Errs = {};
    if (st === 1 && !n.service) er.service = 1;
    if (st === 2) { if (!n.city) er.city = 1; if (!n.area) er.area = 1; if (!V.pin(n.pin || "")) er.pin = 1; }
    if (st === 3 && !n.duty) er.duty = 1;
    if (st === 4) { if (!n.family) er.family = 1; if (!n.home) er.home = 1; if ((n.resp || "").trim().length < 10) er.resp = 1; }
    if (st === 5) { if (!n.date || n.date < today()) er.date = 1; if (!(n.days || []).length) er.days = 1; if (n.duty !== "live-in") { if (!n.start) er.start = 1; if (!n.end || n.end <= (n.start || "")) er.end = 1; } }
    if (st === 6) { if (!V.name(n.name || "")) er.name = 1; if (!V.phone(n.phone || "")) er.phone = 1; if (!V.email(n.email || "")) er.email = 1; if ((n.address || "").trim().length < 5) er.address = 1; }
    if (st === 7 && !n.consent) er.consent = 1;
    if (Object.keys(er).length) { toast("Please complete the highlighted fields."); setBK(b => ({ ...b, d: n })); return er; }
    if (st < 7) { setBK(b => ({ ...b, d: n, step: b.step + 1 })); window.scrollTo({ top: 0 }); return; }
    const b = createBooking({ ...n, phone: normPhone(n.phone || ""), source: n.source || "Booking form" });
    setBK(() => ({ step: 1, d: {}, done: b })); window.scrollTo({ top: 0 });
  };

  const otherArea = () => openModal("Enter your area", <Form onData={f => {
    const v = String(f.oa || "").trim(); if (v.length < 2) return { oa: 1 };
    const city = (ref.current?.querySelector("[name=city]") as HTMLSelectElement | null)?.value || d.city || "";
    if (!city) { toast("Select your city first."); return; }
    update(s => { const c = s.cities.find(x => x.slug === city); if (c && !c.areas.includes(v)) c.areas.push(v); });
    setBK(b => ({ ...b, d: { ...b.d, ...collect(), city, area: v } })); closeModal();
  }}><Field name="oa" label="Area / locality name" err="Enter at least 2 characters" /><button className="btn btn-primary btn-block">Use this area</button></Form>);

  let body: React.ReactNode = null;
  if (st === 1) body = <>
    <h2>What service do you need?</h2><p className="muted">Pick the main service. You can add more below.</p>
    {(Object.entries(GROUPS) as [Group, typeof GROUPS.maid][]).map(([g, G]) => <div key={g}><h4 style={{ margin: "18px 0 10px", fontSize: 14, color: "var(--muted)" }}>{G.n}</h4><div className="opt-grid">{activeSvcs(S).filter(s => s.group === g).map(s => <button type="button" key={s.slug} className={"opt" + (d.service === s.slug ? " sel" : "")} onClick={() => setD({ service: s.slug, extra: (d.extra || []).filter(x => x !== s.slug) })}><span className="oi" style={{ background: G.g }}><Ic n={G.ic} s={18} /></span>{s.name}</button>)}</div></div>)}
    <FieldWrap name="service" err="Please choose a service" />
    {d.service && <><h4 style={{ marginTop: 22 }}>Add another service (optional)</h4><div className="chips">{activeSvcs(S).filter(s => s.slug !== d.service).map(s => { const on = (d.extra || []).includes(s.slug); return <button type="button" key={s.slug} className="chip click" style={on ? { background: "var(--green-l)", borderColor: "var(--green)", color: "#0b5e4f" } : undefined} onClick={() => setD({ extra: on ? (d.extra || []).filter(x => x !== s.slug) : [...(d.extra || []), s.slug] })}>{on ? "✓ " : "+ "}{s.name}</button>; })}</div></>}
  </>;
  if (st === 2) body = <>
    <h2>Where do you need help?</h2><p className="muted">We use this to match professionals near you.</p>
    <CityArea key={(d.city || "") + (d.area || "")} city={d.city} area={d.area} req cityErr="Select your city" areaErr="Select your area" />
    <Field name="pin" label="PIN code" value={d.pin} ph="6-digit PIN" inputMode="numeric" maxLength={6} err="Enter a valid 6-digit PIN code" hint="Optional, helps us confirm coverage." />
    <p className="small muted">Area not listed? <button type="button" className="link" onClick={otherArea}>Enter it manually</button></p>
  </>;
  if (st === 3) body = <>
    <h2>Choose a duty type</h2><p className="muted">Not sure? Pick the closest — we&apos;ll help you decide on the call.</p>
    <div className="grid g2">{DUTY.map(x => <button type="button" key={x.k} className={"opt" + (d.duty === x.k ? " sel" : "")} style={{ padding: 18, alignItems: "flex-start" }} onClick={() => setD({ duty: x.k })}><span className="oi" style={{ background: x.c }}><Ic n={x.ic} s={18} /></span><span><b style={{ display: "block", color: "var(--navy)" }}>{x.n}</b><span className="muted small" style={{ fontWeight: 400 }}>{x.d}</span></span></button>)}</div>
    <FieldWrap name="duty" err="Please choose a duty type" />
  </>;
  if (st === 4) body = <>
    <h2>Tell us about your requirements</h2>
    <div className="frow"><Field name="family" label="Family members" type="select" opts={["1", "2", "3", "4", "5", "6", "7+"]} value={d.family} req err="Select family size" /><Field name="home" label="Home size" type="select" opts={["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Villa / Bungalow", "Office"]} value={d.home} req err="Select home size" /></div>
    <Field name="resp" label="Specific responsibilities" type="textarea" value={d.resp} ph="e.g. cleaning + utensils + cooking lunch for 4 (Jain), care for 2-year-old…" req err="Briefly describe the work (at least 10 characters)" />
    <div className="frow3"><Field name="lang" label="Language preference" type="select" opts={["Any", ...LANGS]} value={d.lang || "Any"} placeholder={false} /><Field name="expReq" label="Experience required" type="select" opts={[["Any", "Any"], ["1", "1+ years"], ["3", "3+ years"], ["5", "5+ years"]]} value={d.expReq || "Any"} placeholder={false} /><Field name="gender" label="Preference (optional)" type="select" opts={["No preference", "Female", "Male"]} value={d.gender || "No preference"} placeholder={false} /></div>
    <Field name="notes" label="Special instructions" type="textarea" value={d.notes} ph="Pets at home, elderly with special needs, dietary rules…" />
  </>;
  if (st === 5) body = <>
    <h2>When should the service start?</h2>
    <Field name="date" label="Preferred joining date" type="date" value={d.date} req min={today()} err="Choose a date from today onwards" />
    <FieldWrap name="days" label="Working days" req err="Select at least one day"><div className="days">{DAYS.map(x => <label key={x}><input type="checkbox" name="days" data-multi value={x} defaultChecked={(d.days || []).includes(x)} /><span>{x}</span></label>)}</div></FieldWrap>
    {d.duty === "live-in" ? <div className="note info"><Ic n="home" s={18} /><div>Live-in professionals stay with your family. Rest hours and weekly off are agreed during the interview.</div></div>
      : <div className="frow"><Field name="start" label="Starting time" type="time" value={d.start || "09:00"} req err="Choose a start time" /><Field name="end" label="Ending time" type="time" value={d.end || "13:00"} req err="End time must be after start time" /></div>}
  </>;
  if (st === 6) body = <>
    <h2>Your contact details</h2><p className="muted">We&apos;ll call you to confirm requirements. Your details are never shared with staff without your consent.</p>
    <div className="frow"><Field name="name" label="Full name" value={d.name} req err="Enter your full name" /><Field name="phone" label="Mobile number" type="tel" value={d.phone} req ph="10-digit mobile" inputMode="numeric" maxLength={14} err="Enter a valid 10-digit Indian mobile number" /></div>
    <Field name="email" label="Email" type="email" value={d.email} ph="you@example.com" err="Enter a valid email address" hint="Optional — for booking confirmation and invoices." />
    <Field name="address" label="Address" type="textarea" value={d.address} req ph="Flat / house no., society, landmark" err="Enter your address" />
  </>;
  if (st === 7) body = <>
    <h2>Review & submit</h2>
    <table className="sumtbl"><tbody>
      <tr><td>Service</td><td><b>{svcName(S, d.service)}</b>{(d.extra || []).length > 0 && <><br /><span className="muted small">+ {(d.extra || []).map(x => svcName(S, x)).join(", ")}</span></>}</td></tr>
      <tr><td>Location</td><td>{d.area}, {cityName(S, d.city)}{d.pin ? " – " + d.pin : ""}</td></tr>
      <tr><td>Duty type</td><td>{dutyName(d.duty)}</td></tr>
      <tr><td>Household</td><td>{d.family} members · {d.home}</td></tr>
      <tr><td>Responsibilities</td><td>{d.resp}</td></tr>
      <tr><td>Preferences</td><td>Language: {d.lang} · Experience: {d.expReq}{d.gender && d.gender !== "No preference" ? " · " + d.gender : ""}</td></tr>
      {d.notes && <tr><td>Instructions</td><td>{d.notes}</td></tr>}
      <tr><td>Schedule</td><td>From {fmtDate(d.date)} · {(d.days || []).join(", ")}{d.duty !== "live-in" ? ` · ${d.start}–${d.end}` : " · live-in"}</td></tr>
      <tr><td>Contact</td><td>{d.name} · {d.phone}{d.email ? " · " + d.email : ""}<br /><span className="muted small">{d.address}</span></td></tr>
    </tbody></table>
    <div className="frow" style={{ marginTop: 18, alignItems: "end" }}><Field name="coupon" label="Coupon / referral code" value={d.coupon} ph="Optional" /><div className="field"><button type="button" className="btn btn-ghost" onClick={() => { const v = (ref.current?.querySelector("[name=coupon]") as HTMLInputElement).value.trim().toUpperCase(); setD({ coupon: v }); }}>Apply</button></div></div>
    {d.coupon && (coupon ? <div className="note ok"><Ic n="gift" s={18} /><div>Code <b>{coupon.code}</b> applied — {coupon.type === "percent" ? coupon.value + "% off" : inr(coupon.value) + " off"} the service fee on your quote.</div></div>
      : <div className="note warn"><Ic n="tag" s={18} /><div>Code not recognised. You can still submit — our team will check it.</div></div>)}
    <label className="check" style={{ marginTop: 16 }}><input type="checkbox" name="consent" defaultChecked={d.consent} /> <span>I agree to the <Link className="link" href="/terms-and-conditions" target="_blank">Terms</Link> and <Link className="link" href="/privacy-policy" target="_blank">Privacy Policy</Link>, and consent to be contacted by phone, SMS or WhatsApp about this enquiry.</span></label>
    <FieldWrap name="consent" err="Please accept to continue" />
  </>;

  return <>
    <PageHead title="Book a Service" sub="Seven quick steps. Your enquiry is saved instantly and you get a booking ID to track progress." cr={[[null, "Book a Service"]]} />
    <section className="sec"><div className="container split">
      <Form key={st} formRef={ref} className="card pad" onData={onData}>
        <div className="wz-prog">{WZ.map((_, i) => <div key={i} className={i + 1 < st ? "done" : i + 1 === st ? "cur" : ""} />)}</div>
        <div className="wz-labels"><span>Step {st} of 7 · {WZ[st - 1]}</span><span>{Math.round((st - 1) / 7 * 100)}% complete</span></div>
        {body}
        <div className="wz-nav">{st > 1 ? <button type="button" className="btn btn-ghost" onClick={back}><Ic n="back" s={16} /> Back</button> : <span />}<button className={"btn " + (st === 7 ? "btn-green" : "btn-primary")}>{st === 7 ? <>Submit booking <Ic n="check" s={16} sw={2.4} /></> : <>Continue <Ic n="arrow" s={16} /></>}</button></div>
      </Form>
      <aside className="sticky">
        <div className="card pad"><h4>Your booking</h4><table className="sumtbl small"><tbody><tr><td>Service</td><td>{d.service ? svcName(S, d.service) : "—"}</td></tr><tr><td>City</td><td>{d.city ? cityName(S, d.city) : "—"}</td></tr><tr><td>Duty</td><td>{d.duty ? dutyName(d.duty) : "—"}</td></tr><tr><td>Start</td><td>{d.date ? fmtDate(d.date) : "—"}</td></tr></tbody></table>
          {svc && priceText(svc) ? <p className="price" style={{ marginTop: 12 }}>{priceText(svc)}</p> : <p className="small muted" style={{ marginTop: 12 }}>You&apos;ll receive a clear quote before confirming.</p>}</div>
        <div className="card pad" style={{ marginTop: 16 }}><ul className="list-check small"><li><Ic n="shield" s={16} />Verification status shown on every profile</li><li><Ic n="interview" s={16} />Interview before you confirm</li><li><Ic n="lock" s={16} />Your details stay private</li></ul><button className="btn btn-wa btn-sm btn-block" style={{ marginTop: 14 }} type="button" onClick={() => openWA()}>Prefer WhatsApp?</button></div>
      </aside>
    </div></section>
  </>;
}

export function TrackView() {
  const { S, ready } = useStore(); const sp = useSearchParams();
  const [q, setQ] = useState<{ id: string; phone: string } | null>(sp.get("id") ? { id: sp.get("id") || "", phone: sp.get("phone") || "" } : null);
  const b = q ? S.bookings.find(x => x.id.toUpperCase() === q.id.trim().toUpperCase() && x.phone === normPhone(q.phone)) : undefined;
  return <>
    <PageHead title="Track Your Booking" sub="Enter your booking ID and mobile number to see live progress and staff assignment." cr={[[null, "Track Booking"]]} />
    <section className="sec"><div className="container" style={{ maxWidth: 760 }}>
      <Form className="card pad" onData={f => { setQ({ id: f.id, phone: f.phone }); }}>
        <div className="frow"><Field name="id" label="Booking ID" value={q?.id} ph="GM-XXXXXX-XXXX" /><Field name="phone" label="Mobile number" type="tel" value={q?.phone} /></div>
        <button className="btn btn-primary"><Ic n="search" s={16} /> Track booking</button>
      </Form>
      {q && ready && (b ? <BookingStatusCard b={b} /> : <div className="note warn" style={{ marginTop: 18 }}><Ic n="search" s={18} /><div>No booking found for that ID and mobile number. Check both and try again.</div></div>)}
    </div></section>
  </>;
}
