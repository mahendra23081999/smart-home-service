"use client";
import { createContext, useContext, useId, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { DUTY, GROUPS, STATUSES, ST_COLOR, STAFF_COLOR, VER_ITEMS, type Booking, type Faq, type Group, type Review, type Service, type Staff } from "@/lib/data";
import { useStore, today } from "@/lib/store";
import { activeCities, activeSvcs, areaOpts, availText, cityName, cityOpts, dutyName, fmtDT, normPhone, photoKey, priceText, ranked, readForm, sceneFor, svcBy, svcName, verCount, V, type FD } from "@/lib/utils";
import { Ic, Ph, StarIc } from "./art";

/* ================= Forms ================= */
export type Errs = Record<string, unknown>;
const ErrCtx = createContext<Errs>({});

/** Uncontrolled form. onData returns an errors object; empty/undefined = success. */
export function Form({ onData, children, className, id, style, formRef, onChange }: {
  onData: (d: FD, form: HTMLFormElement) => Errs | void; children: ReactNode; className?: string; id?: string; style?: CSSProperties;
  formRef?: React.RefObject<HTMLFormElement | null>; onChange?: (form: HTMLFormElement) => void;
}) {

  const [errs, setErrs] = useState<Errs>({});
  const own = useRef<HTMLFormElement>(null); const ref = formRef || own;
  return <ErrCtx.Provider value={errs}>
    <form ref={ref} id={id} className={className} style={style} noValidate
      onChange={onChange ? e => onChange(e.currentTarget) : undefined}
      onSubmit={e => {
        e.preventDefault(); const f = e.currentTarget; const r = onData(readForm(f), f) || {}; setErrs(r);
        if (Object.keys(r).length) setTimeout(() => (f.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea") as HTMLElement | null)?.focus(), 0);
      }}>{children}</form>
  </ErrCtx.Provider>;
  
}
export function FieldWrap({ name, label, req, err, hint, htmlFor, children, style }: { name: string; label?: ReactNode; req?: boolean; err?: string; hint?: string; htmlFor?: string; children?: ReactNode; style?: CSSProperties }) {
  const errs = useContext(ErrCtx);
  return <div className={"field" + (errs[name] ? " invalid" : "")} data-f={name} style={style}>
    {label && <label htmlFor={htmlFor}>{label}{req && <span style={{ color: "var(--red)" }}> *</span>}</label>}
    {children}{hint && <span className="hint">{hint}</span>}<span className="err">{err || "Please check this field"}</span>
  </div>;
}
type Opt = string | [string, string];
export interface FieldP {
  name: string; label: string; type?: string; value?: string | number; opts?: Opt[]; req?: boolean; hint?: string; err?: string;
  placeholder?: string | false; ph?: string; disabled?: boolean; min?: string | number; max?: string | number; maxLength?: number;
  inputMode?: "numeric" | "text" | "tel" | "email"; accept?: string; autoComplete?: string; rows?: number;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; style?: CSSProperties;
}
export function Field(o: FieldP) {
  const id = "f_" + o.name + useId().replace(/:/g, "");
  const val = o.value ?? "";
  const common = { id, name: o.name, onChange: o.onChange, disabled: o.disabled };
  let inp: ReactNode;
  if (o.type === "select") inp = <select {...common} defaultValue={String(val)}>
    {o.placeholder !== false && <option value="">{o.placeholder || "Select…"}</option>}
    {(o.opts || []).map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return <option key={v} value={v}>{l}</option>; })}
  </select>;
  else if (o.type === "textarea") inp = <textarea {...common} defaultValue={String(val)} placeholder={o.ph} rows={o.rows} />;
  else inp = <input {...common} type={o.type || "text"} defaultValue={o.type === "file" ? undefined : String(val)} placeholder={o.ph} min={o.min} max={o.max} maxLength={o.maxLength} inputMode={o.inputMode} accept={o.accept} autoComplete={o.autoComplete} />;
  return <FieldWrap name={o.name} label={o.label} req={o.req} err={o.err} hint={o.hint} htmlFor={id} style={o.style}>{inp}</FieldWrap>;
}
export function SvcOptions() {
  const { S } = useStore();
  return <>{(Object.entries(GROUPS) as [Group, typeof GROUPS.maid][]).map(([g, G]) => <optgroup key={g} label={G.n}>{activeSvcs(S).filter(s => s.group === g).map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}</optgroup>)}</>;
}
export function SvcSelect({ name, label, value, placeholder, req, err }: { name: string; label: string; value?: string; placeholder?: string | false; req?: boolean; err?: string }) {
  const id = "f_" + name + useId().replace(/:/g, "");
  return <FieldWrap name={name} label={label} req={req} err={err} htmlFor={id}><select id={id} name={name} defaultValue={value || ""}>{placeholder !== false && <option value="">{placeholder || "Select service"}</option>}<SvcOptions /></select></FieldWrap>;
}
/** City + dependent area selects. */
export function CityArea({ city = "", area = "", cityLabel = "City", areaLabel = "Area / locality", req, cityErr, areaErr, cityName: cn = "city", areaName: an = "area", cityPlaceholder, areaPlaceholder, onCity }: {
  city?: string; area?: string; cityLabel?: string; areaLabel?: string; req?: boolean; cityErr?: string; areaErr?: string; cityName?: string; areaName?: string; cityPlaceholder?: string; areaPlaceholder?: string; onCity?: (c: string) => void;
}) {
  const { S } = useStore(); const [c, setC] = useState(city);
  return <>
    <Field name={cn} label={cityLabel} type="select" opts={cityOpts(S)} value={city} req={req} err={cityErr} placeholder={cityPlaceholder} onChange={e => { setC(e.target.value); onCity?.(e.target.value); }} />
    <Field key={c} name={an} label={areaLabel} type="select" opts={areaOpts(S, c)} value={c === city ? area : ""} req={req} err={areaErr} placeholder={areaPlaceholder ?? (c ? "Select area…" : "Select city first")} />
  </>;
}

/* ================= Layout bits ================= */
export function Crumbs({ items }: { items: [string | null, string][] }) {
  return <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>{items.map(([h, l], i) => <span key={i} style={{ display: "contents" }}><span>›</span>{h ? <Link href={h}>{l}</Link> : <span style={{ color: "#fff" }}>{l}</span>}</span>)}</nav>;
}
export function PageHead({ title, sub, cr }: { title: string; sub?: ReactNode; cr?: [string | null, string][] }) {
  return <section className="phead"><div className="container"><Crumbs items={cr || [[null, title]]} /><h1>{title}</h1>{sub && <p>{sub}</p>}</div></section>;
}
export const Hi = ({ text }: { text: string }) => <>{text.split(/\*(.+?)\*/g).map((p, i) => i % 2 ? <em key={i}>{p}</em> : p)}</>;
export function Loading() { return <section className="sec"><div className="container" style={{ display: "grid", gap: 16 }}><div className="skel" style={{ height: 40, width: "40%" }} /><div className="skel" style={{ height: 160 }} /><div className="skel" style={{ height: 160 }} /></div></section>; }
export function NotFoundView() {
  const { go } = useStore();
  return <><PageHead title="Page not found" sub="The page you were looking for doesn't exist." cr={[[null, "Not found"]]} /><section className="sec"><div className="container" style={{ textAlign: "center" }}><button className="btn btn-primary" onClick={() => go("/")}>Go home</button></div></section></>;
}

/* ================= Small display components ================= */
export function Avatar({ p, size }: { p: Staff; size?: number }) {
  const G = GROUPS[p.group] || GROUPS.maid; const col = STAFF_COLOR[p.status] || "#94a3b8";
  return <div className="avatar" style={{ background: G.g, ...(size ? { width: size, height: size, fontSize: size / 2.6 } : {}) }}>
    {p.photo ? <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : (p.name || "?")[0]}
    <span className="dot" style={{ background: col }} />
  </div>;
}
export const Badge = ({ st, map }: { st: string; map?: Record<string, string> }) => { const c = (map || ST_COLOR)[st] || "#64748b"; return <span className="badge" style={{ background: c + "18", color: c }}>{st}</span>; };
export const DemoTag = ({ x }: { x?: { demo?: boolean } | null }) => x?.demo ? <span className="tag orange">DEMO</span> : null;
export const Stars = ({ n, s }: { n: number; s?: number }) => <span className="stars">{[1, 2, 3, 4, 5].map(i => <StarIc key={i} on={i <= n} s={s} />)}</span>;
export function VerBadge({ p }: { p: Staff }) {
  const n = verCount(p);
  if (n === VER_ITEMS.length) return <span className="tag"><Ic n="shield" s={13} sw={2.2} /> Fully verified</span>;
  if (p.ver?.id === "Done") return <span className="tag navy"><Ic n="shield" s={13} sw={2.2} /> ID verified · {n}/{VER_ITEMS.length} checks</span>;
  return <span className="tag gray">Verification in progress</span>;
}

/* ================= Cards ================= */
export function SvcCard({ s }: { s: Service }) {
  const { startBooking } = useStore();
  return <article className="card svc-card reveal">
    <Link href={`/services/${s.slug}`} aria-label={s.name} className="svc-media">
      <Ph group={s.group} cap={s.cap} img={s.img} scene={sceneFor(s)} photo={photoKey(s)} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 300px" />
      <span className="svc-shade" />
      <span className="svc-cat"><span className="svc-cat-ic" style={{ background: GROUPS[s.group]?.g }}><Ic n={GROUPS[s.group]?.ic || "home"} s={14} sw={2} /></span>{GROUPS[s.group]?.n}</span>
      <span className="svc-ver"><Ic n="shield" s={13} sw={2.2} /> Verified staff</span>
    </Link>
    <div className="svc-body">
      <h3><Link href={`/services/${s.slug}`}>{s.name}</Link></h3><p>{s.short}</p>
      <ul className="feat">{s.features.map(f => <li key={f}><Ic n="check" s={15} sw={2.4} />{f}</li>)}</ul>
      <div className="svc-foot">{priceText(s) && <span className="price">{priceText(s)}</span>}
        <div className="svc-btns"><Link className="btn btn-ghost btn-sm" href={`/services/${s.slug}`}>Details</Link><button className="btn btn-green btn-sm" onClick={() => startBooking({ service: s.slug })}>Book Now <Ic n="arrow" s={14} /></button></div>
      </div>
    </div>
  </article>;
}
export function ProCard({ p, score }: { p: Staff; score?: number | null }) {
  const { S, openModal } = useStore(); const c = STAFF_COLOR[p.status];
  return <article className="card pro-card reveal">
    <div className="pro-top"><Avatar p={p} /><div style={{ minWidth: 0 }}><div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><h3>{p.name}</h3><DemoTag x={p} />{score != null && <span className="match">{score}% match</span>}</div><div className="muted small">{p.role} · {p.exp} yrs exp.</div></div></div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><VerBadge p={p} /><span className="badge" style={{ background: c + "18", color: c }}>{availText(p)}</span></div>
    <div className="chips">{p.skills.slice(0, 4).map(x => <span key={x} className="chip">{x}</span>)}</div>
    <div className="pro-meta"><span><Ic n="chat" s={14} />{p.langs.join(", ")}</span><span><Ic n="map" s={14} />{p.area}, {cityName(S, p.city)}</span><span style={{ gridColumn: "1/-1" }}><Ic n="clock" s={14} />{p.hours}</span></div>
    <div className="pro-actions"><Link className="btn btn-ghost btn-sm" href={`/professionals/${p.id}`}>View Profile</Link><button className="btn btn-navy btn-sm" onClick={() => openModal(`Request interview — ${p.name}`, <InterviewModal id={p.id} />)}>Request Interview</button></div>
  </article>;
}
export function FaqBlock({ list }: { list: Pick<Faq, "q" | "a">[] }) {
  return <div className="faq">{list.map((f, i) => <details key={i}><summary>{f.q}<span className="pm"><Ic n="plus" s={16} sw={2.2} /></span></summary><p>{f.a}</p></details>)}</div>;
}
export function ReviewCards({ list }: { list: Review[] }) {
  const { S } = useStore();
  if (!list.length) return <div className="card empty"><Ic n="star" s={40} /><p>No reviews published yet. Reviews appear here after customers complete a booking and an admin approves them.</p></div>;
  return <div className="grid g3">{list.map(r => <article key={r.id} className="card review reveal">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Stars n={r.rating} /><DemoTag x={r} /></div>
    <blockquote>“{r.text}”</blockquote>
    <div className="rv-by"><div className="avatar" style={{ background: GROUPS[svcBy(S, r.service)?.group || "maid"].g }}>{r.name[0]}</div><div><b style={{ color: "var(--navy)" }}>{r.name}</b><div className="muted small">{r.city} · {svcName(S, r.service)}</div></div></div>
  </article>)}</div>;
}
export function CtaBlock() {
  const { S, t, startBooking, openWA } = useStore();
  return <section className="sec-tight"><div className="container"><div className="cta reveal"><div><h2>{S.content.ctaT}</h2><p>{S.content.ctaS}</p></div><div className="btns"><button className="btn btn-primary" onClick={() => startBooking()}>{t("book")} <Ic n="arrow" s={16} /></button><button className="btn btn-wa" onClick={() => openWA()}>Chat on WhatsApp</button></div></div></div></section>;
}

/* ================= Enquiries ================= */
export function QuickEnquiry({ slug = "", city = "" }: { slug?: string; city?: string }) {
  const { S, createBooking, openModal, startBooking } = useStore();
  const ref = useRef<HTMLFormElement>(null);
  return <Form formRef={ref} className="card pad" onData={(d, f) => {
    const er: Errs = {}; if (!d.q_city) er.q_city = 1; if (!d.q_duty) er.q_duty = 1; if (!V.name(d.q_name)) er.q_name = 1; if (!V.phone(d.q_phone)) er.q_phone = 1;
    if (Object.keys(er).length) return er;
    const b = createBooking({ service: d.q_svc, city: d.q_city, duty: d.q_duty, name: d.q_name.trim(), phone: normPhone(d.q_phone), source: "Quick enquiry" });
    openModal("Enquiry received", <SuccessBody b={b} />); f.reset();
  }}>
    <h3 style={{ fontSize: 19 }}>Quick enquiry</h3><p className="muted small">Takes 30 seconds. For detailed requirements, use the full booking form.</p>
    <SvcSelect name="q_svc" label="Service" value={slug || S.services[0]?.slug} placeholder={false} />
    <Field name="q_city" label="City" type="select" opts={cityOpts(S)} value={city} req err="Select your city" />
    <Field name="q_duty" label="Duty type" type="select" opts={DUTY.map(d => [d.k, d.n])} req err="Select a duty type" />
    <Field name="q_name" label="Your name" req err="Enter your name" />
    <Field name="q_phone" label="Mobile number" type="tel" ph="10-digit mobile" req err="Enter a valid 10-digit Indian mobile number" inputMode="numeric" maxLength={14} />
    <button className="btn btn-primary btn-block">Send enquiry</button>
    <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => { const d = readForm(ref.current!); startBooking({ service: d.q_svc, city: d.q_city, duty: d.q_duty }); }}>Use full booking form</button>
  </Form>;
}
export const WaIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.03c-.25.69-1.44 1.32-2 1.37-.51.05-.99.24-3.33-.69-2.82-1.11-4.6-3.99-4.74-4.18-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.97-2.31.25-.28.55-.35.73-.35l.53.01c.17.01.4-.06.62.47.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.18-.15.3-.3.46-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.12.64-.07.18-.2.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.73.82 2.03.97.3.15.49.22.56.35.07.12.07.72-.18 1.41z" /></svg>;

export function SuccessBody({ b, full }: { b: Booking; full?: boolean }) {
  const { S, closeModal, openWA, callNow, enquiryText, go } = useStore(); const n = S.settings;
  const r = ranked(S, { service: b.service, city: b.city, duty: b.duty, lang: b.lang !== "Any" ? b.lang : "" }).filter(x => x.s >= 55).slice(0, full ? 4 : 2);
  return <>
    <div className="connect">
      <b>Connect with us now — fastest on WhatsApp</b>
      <p className="small">WhatsApp has opened with your enquiry details. Just press <b>Send</b>. If it didn&apos;t open, tap below.</p>
      <div className="connect-btns">
        <button className="btn btn-wa" onClick={() => openWA(enquiryText(b))}><WaIcon /> Continue on WhatsApp</button>
        <button className="btn btn-navy" onClick={callNow}><Ic n="phone" s={18} /> Call {n.phone}</button>
      </div>
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 70, height: 70, borderRadius: 22, background: "var(--green-l)", color: "var(--green)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Ic n="check" s={36} sw={2.4} /></div>
      <h2 style={{ marginBottom: 6 }}>Thank you, {(b.name || "").split(" ")[0]}!</h2>
      <p className="muted">Your enquiry for <b>{svcName(S, b.service)}</b> in {cityName(S, b.city)} has been saved.</p>
      <div className="card" style={{ display: "inline-block", padding: "12px 22px", margin: "6px 0 14px", background: "var(--bg)" }}><span className="muted small">Booking ID</span><div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 22, color: "var(--navy)", letterSpacing: ".04em" }}>{b.id}</div></div>
      <div><Badge st={b.status} /></div>
    </div>
    <ul className="list-check small" style={{ margin: "18px 0" }}>
      <li><Ic n="chat" s={16} />Send the WhatsApp message (or call us) so our team receives your enquiry straight away.</li>
      <li><Ic n="phone" s={16} />We&apos;ll confirm your needs with you on {b.phone} and share suitable profiles.</li>
      <li><Ic n="check" s={16} sw={2.4} />Keep your booking ID to track progress.</li>
    </ul>
    {r.length > 0 && <><h4 style={{ marginTop: 6 }}>Suggested matches (smart matching)</h4><div className={"grid" + (full ? " g2" : "")} style={{ gap: 12 }}>{r.map(x => <div key={x.p.id} className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}><Avatar p={x.p} size={48} /><div style={{ flex: 1, minWidth: 0 }}><b style={{ color: "var(--navy)" }}>{x.p.name}</b> <DemoTag x={x.p} /><div className="muted small">{x.p.role} · {x.p.exp} yrs · {x.p.area}</div></div><span className="match">{x.s}%</span></div>)}</div></>}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
      <button className="btn btn-navy" onClick={() => { closeModal(); go(`/track?id=${encodeURIComponent(b.id)}&phone=${b.phone}`); }}>Track status</button>
      {S.user ? <button className="btn btn-ghost" onClick={() => { closeModal(); go("/dashboard"); }}>My dashboard</button> : <button className="btn btn-ghost" onClick={() => { closeModal(); go("/login"); }}>Create account to track</button>}
    </div>
  </>;
}
export function BookingStatusCard({ b, actions }: { b: Booking; actions?: ReactNode }) {
  const { S } = useStore();
  const idx = b.status === "Cancelled" ? -1 : STATUSES.indexOf(b.status);
  const flow = STATUSES.filter(s => s !== "Cancelled");
  const staff = b.staff ? S.staff.find(p => p.id === b.staff) : undefined;
  return <div className="card pad" style={{ marginTop: 18 }}>
    <div className="h-sec"><div><span className="muted small">Booking ID</span><h3 style={{ margin: 0 }}>{b.id} <DemoTag x={b} /></h3></div><Badge st={b.status} /></div>
    <table className="sumtbl small" style={{ marginBottom: 18 }}><tbody>
      <tr><td>Service</td><td>{svcName(S, b.service)}{b.extra?.length ? " + " + b.extra.map(x => svcName(S, x)).join(", ") : ""}</td></tr>
      <tr><td>Location</td><td>{b.area || "—"}, {cityName(S, b.city)}</td></tr>
      <tr><td>Duty</td><td>{dutyName(b.duty)}</td></tr>
      <tr><td>Created</td><td>{fmtDT(b.created)}</td></tr>
      {b.interviewAt && <tr><td>Interview</td><td>{fmtDT(b.interviewAt)}</td></tr>}
      <tr><td>Professional</td><td>{staff ? `${staff.name} — ${staff.role}` : b.shortlist?.length ? `${b.shortlist.length} profile(s) shortlisted` : "Being matched"}</td></tr>
      {b.cancelReq && <tr><td>Cancellation</td><td><span className="tag red">Requested</span></td></tr>}
      {b.replaceReq && <tr><td>Replacement</td><td><span className="tag orange">Requested</span></td></tr>}
    </tbody></table>
    {b.status === "Cancelled" ? <div className="note warn"><Ic n="x" s={18} /><div>This booking was cancelled on {fmtDT(b.history.find(h => h.s === "Cancelled")?.at)}.</div></div>
      : <ul className="stl">{flow.map((s, i) => { const h = b.history.find(x => x.s === s); return <li key={s} className={i < idx ? "done" : i === idx ? "cur" : ""}><span className="sd">{i < idx ? <Ic n="check" s={14} sw={2.6} /> : i === idx ? <Ic n="clock" s={14} /> : null}</span><div><b style={{ color: i <= idx ? "var(--navy)" : "#94a3b8" }}>{s}</b>{h && <span className="muted small"> · {fmtDT(h.at)}</span>}</div></li>; })}</ul>}
    {actions}
  </div>;
}
export function InterviewModal({ id }: { id: string }) {
  const { S, createBooking, openModal } = useStore(); const p = S.staff.find(x => x.id === id);
  if (!p) return null;
  return <Form onData={d => {
    const er: Errs = {}; if (!V.name(d.name)) er.name = 1; if (!V.phone(d.phone)) er.phone = 1; if (!d.date) er.date = 1; if (Object.keys(er).length) return er;
    const b = createBooking({ service: p.services[0], city: p.city, area: p.area, name: d.name.trim(), phone: normPhone(d.phone), notes: `Interview requested with ${p.name} (${p.id}) — ${d.mode} on ${d.date}. ${d.notes || ""}`, shortlist: [p.id], source: "Interview request", interviewPref: d.date });
    openModal("Interview requested", <SuccessBody b={b} />);
  }}>
    <p className="muted small">{p.role} · {p.exp} yrs · {p.area}, {cityName(S, p.city)}</p>
    <div className="frow"><Field name="name" label="Your name" req value={S.user?.name} err="Enter your name" /><Field name="phone" label="Mobile number" type="tel" req value={S.user?.phone} err="Enter a valid 10-digit mobile number" /></div>
    <div className="frow"><Field name="date" label="Preferred date" type="date" req min={today()} err="Choose a date" /><Field name="mode" label="Interview mode" type="select" opts={["In person", "Video call", "Phone call"]} value="In person" placeholder={false} /></div>
    <Field name="notes" label="Anything we should know?" type="textarea" ph="Working hours, duties, start date…" />
    <button className="btn btn-primary btn-block">Send interview request</button>
  </Form>;
}
export function UrgentModal() {
  const { S, createBooking, openModal, callNow } = useStore();
  return <Form onData={d => {
    const er: Errs = {}; if (!V.name(d.name)) er.name = 1; if (!V.phone(d.phone)) er.phone = 1; if (!d.city) er.city = 1; if (Object.keys(er).length) return er;
    const b = createBooking({ service: d.service, city: d.city, name: d.name.trim(), phone: normPhone(d.phone), notes: `URGENT — needed ${d.when}. ${d.notes || ""}`, urgent: true, source: "Urgent enquiry", date: today() });
    openModal("Urgent enquiry received", <SuccessBody b={b} />);
  }}>
    <div className="note warn" style={{ marginBottom: 16 }}><Ic n="bolt" s={18} /><div className="small">{S.settings.urgentNote}</div></div>
    <div className="frow"><Field name="name" label="Name" req err="Enter your name" value={S.user?.name} /><Field name="phone" label="Mobile" type="tel" req err="Enter a valid 10-digit mobile number" value={S.user?.phone} /></div>
    <div className="frow"><SvcSelect name="service" label="Service" value="patient-care" placeholder={false} /><Field name="city" label="City" type="select" opts={cityOpts(S)} req err="Select your city" /></div>
    <Field name="when" label="Needed by" type="select" opts={["Today", "Tomorrow", "Within 3 days"]} value="Today" placeholder={false} />
    <Field name="notes" label="Details" type="textarea" ph="e.g. Patient discharged today, need night attendant" />
    <button className="btn btn-primary btn-block"><Ic n="bolt" s={16} /> Send urgent enquiry</button>
    <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={callNow}><Ic n="phone" s={16} /> Call {S.settings.phone || "+91 XXXXX XXXXX"}</button>
  </Form>;
}
export const useCities = () => { const { S } = useStore(); return activeCities(S); };
