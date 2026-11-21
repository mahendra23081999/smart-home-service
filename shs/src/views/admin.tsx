"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { GROUPS, STAFF_ST, STATUSES, VER_ITEMS, emptyVer, seed, today, uid, type Booking, type Group, type Staff } from "@/lib/data";
import { useStore } from "@/lib/store";
import { activeSvcs, cityBy, cityName, cityOpts, dutyName, fmtDate, fmtDT, inr, normPhone, photoKey, ranked, readImg, sceneFor, svcBy, svcName, verCount, V } from "@/lib/utils";
import { Ic, Photo, Scene, SCENES } from "@/components/art";
import { Avatar, Badge, CityArea, DemoTag, Field, FieldWrap, Form, Loading, PageHead, Stars, type Errs } from "@/components/blocks";
import { copyText } from "./account";

const kpi = (l: string, v: ReactNode, i: string, c?: string) => <div className="card kpi" key={l}><span><Ic n={i} s={15} /> {l}</span><b style={c ? { color: c } : undefined}>{v}</b></div>;
const barRow = (l: string, v: number, max: number) => <div className="bar" key={l}><span>{l}</span><div className="tr"><div className="fl" style={{ width: `${max ? Math.max(4, v / max * 100) : 0}%` }} /></div><b style={{ textAlign: "right" }}>{v}</b></div>;
const groupOpts = () => (Object.entries(GROUPS) as [Group, { n: string }][]).map(([k, g]) => [k, g.n] as [string, string]);

function ConfirmBtn({ onConfirm, label = "Delete", className = "btn btn-red btn-sm" }: { onConfirm: () => void; label?: string; className?: string }) {
  const [c, setC] = useState(false);
  return <button type="button" className={className} onClick={() => { if (c) onConfirm(); else { setC(true); setTimeout(() => setC(false), 3000); } }}>{c ? "Click again to confirm" : label}</button>;
}

export function AdminView() {
  const { S, ready, admin, setAdmin } = useStore();
  const [tab, setTab] = useState("overview");
  if (!ready) return <Loading />;
  if (!admin) return <>
    <PageHead title="Admin Login" sub="Restricted area for authorised staff." cr={[[null, "Admin"]]} />
    <section className="sec"><div className="container" style={{ maxWidth: 460 }}><Form className="card pad" onData={d => { if (d.pin === S.settings.adminPin) setAdmin(true); else return { pin: 1 }; }}>
      <Field name="pin" label="Admin password" type="password" err="Incorrect password" />
      <button className="btn btn-navy btn-block"><Ic n="lock" s={16} /> Sign in</button>
      <div className="note warn" style={{ marginTop: 14 }}><Ic n="lock" s={18} /><div className="small"><b>Demo password:</b> admin123 (change it in Settings). This frontend-only build checks the password in the browser, so it is <b>not real security</b> — secure admin accounts with role-based access need a backend.</div></div>
    </Form></div></section>
  </>;
  const pendRev = S.reviews.filter(r => r.status === "pending").length, pendStaff = S.staff.filter(p => ["Pending", "Verification in Progress"].includes(p.status)).length, newB = S.bookings.filter(b => b.status === "New Enquiry").length, openTk = S.tickets.filter(t => t.status === "Open").length;
  const tabs: [string, string, string, number?][] = [["overview", "Overview", "grid"], ["bookings", "Bookings", "cal", newB], ["staff", "Staff", "users", pendStaff], ["services", "Services", "home"], ["customers", "Customers & support", "user", openTk], ["locations", "Locations", "map"], ["content", "Content", "edit", pendRev], ["marketing", "Marketing", "megaphone"], ["reports", "Reports", "chart"], ["settings", "Settings", "gear"]];
  const body = { overview: <Overview go={setTab} />, bookings: <Bookings />, staff: <StaffTab />, services: <ServicesTab />, customers: <Customers go={setTab} />, locations: <Locations />, content: <Content />, marketing: <Marketing />, reports: <Reports />, settings: <SettingsTab /> }[tab];
  return <section className="sec-tight" style={{ background: "#eef3f8", minHeight: "80vh" }}><div className="container">
    <div className="h-sec"><div><span className="eyebrow">Admin panel</span><h1 style={{ fontSize: 28, margin: 0 }}>{S.settings.brand} control centre</h1></div><button className="btn btn-ghost btn-sm" onClick={() => setAdmin(false)}><Ic n="logout" s={16} /> Sign out</button></div>
    <div className="dash"><nav className="side">{tabs.map(([k, l, i, c]) => <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}><Ic n={i} s={18} /> {l}{c ? <span className="cnt">{c}</span> : null}</button>)}</nav><div>{body}</div></div>
  </div></section>;
}

/* ---------- Overview ---------- */
function Overview({ go }: { go: (t: string) => void }) {
  const { S, openModal } = useStore(); const B = S.bookings;
  const conf = B.filter(b => ["Booking Confirmed", "Service Started", "Completed"].includes(b.status)).length;
  const flags = [...B.filter(b => b.cancelReq && b.status !== "Cancelled").map(b => ["Cancellation request", b] as const), ...B.filter(b => b.replaceReq).map(b => ["Replacement request", b] as const), ...B.filter(b => b.urgent && b.status === "New Enquiry").map(b => ["Urgent enquiry", b] as const)];
  return <>
    <div className="kpis">{kpi("Total enquiries", B.length, "doc")}{kpi("Confirmed bookings", conf, "check", "#0f8a72")}{kpi("Completed", B.filter(b => b.status === "Completed").length, "star")}{kpi("Cancelled", B.filter(b => b.status === "Cancelled").length, "x", "#dc2626")}{kpi("Customers", new Set(B.map(b => b.phone)).size, "user")}{kpi("Registered staff", S.staff.length, "users")}{kpi("Available staff", S.staff.filter(p => p.status === "Available").length, "spark", "#0f8a72")}{kpi("Pending verification", S.staff.filter(p => ["Pending", "Verification in Progress"].includes(p.status)).length, "shield", "#c26a0a")}{kpi("Revenue recorded", inr(B.reduce((a, b) => a + (+b.amountPaid || 0), 0)), "rupee")}</div>
    {flags.length > 0 && <div className="card pad" style={{ marginBottom: 18, borderLeft: "4px solid var(--orange)" }}><h3 style={{ fontSize: 17 }}>Needs attention</h3>{flags.map(([l, b]) => <div key={l + b.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)", alignItems: "center", flexWrap: "wrap" }}><span><span className="tag orange">{l}</span> {b.id} · {b.name} · {svcName(S, b.service)}</span><button className="btn btn-ghost btn-sm" onClick={() => openModal("Booking " + b.id, <ManageBooking id={b.id} />, true)}>Open</button></div>)}</div>}
    <div className="card pad"><div className="h-sec"><h3 style={{ fontSize: 17 }}>Latest enquiries</h3><button className="link" onClick={() => go("bookings")}>View all →</button></div><BookingTable list={B.slice(0, 6)} /></div>
  </>;
}
function BookingTable({ list }: { list: Booking[] }) {
  const { S, openModal } = useStore();
  if (!list.length) return <div className="empty">No bookings match.</div>;
  return <div className="tbl-wrap"><table className="tbl"><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Service</th><th>City</th><th>Duty</th><th>Status</th><th>Staff</th><th></th></tr></thead><tbody>{list.map(b => {
    const p = S.staff.find(x => x.id === b.staff);
    return <tr key={b.id}><td><b>{b.id}</b> <DemoTag x={b} />{b.urgent && <> <span className="tag red">URGENT</span></>}{b.cancelReq && b.status !== "Cancelled" && <> <span className="tag red">Cancel req.</span></>}{b.replaceReq && <> <span className="tag orange">Replace req.</span></>}</td><td>{fmtDate(b.created)}</td><td>{b.name}<div className="muted small">{b.phone}</div></td><td>{svcName(S, b.service)}</td><td>{cityName(S, b.city)}</td><td>{dutyName(b.duty)}</td><td><Badge st={b.status} /></td><td>{p ? p.name : <span className="muted">—</span>}</td><td><button className="btn btn-ghost btn-sm" onClick={() => openModal("Booking " + b.id, <ManageBooking id={b.id} />, true)}>Manage</button></td></tr>;
  })}</tbody></table></div>;
}

/* ---------- Bookings ---------- */
const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function Bookings() {
  const { S, startBooking, toast } = useStore();
  const [f, setF] = useState({ q: "", city: "", service: "", status: "" });
  const q = f.q.toLowerCase();
  const list = S.bookings.filter(b => (!q || [b.id, b.name, b.phone, b.area].join(" ").toLowerCase().includes(q)) && (!f.city || b.city === f.city) && (!f.service || b.service === f.service) && (!f.status || b.status === f.status));
  const exportCsv = () => {
    const cols = ["id", "created", "status", "name", "phone", "email", "service", "city", "area", "duty", "date", "address", "source", "staff", "amountPaid", "notes"] as const;
    const rows = [cols.join(","), ...list.map(b => cols.map(c => csvCell(c === "service" ? svcName(S, b.service) : c === "city" ? cityName(S, b.city) : b[c])).join(","))];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" })); a.download = `bookings-${today()}.csv`; a.click(); URL.revokeObjectURL(a.href); toast(`Exported ${list.length} booking(s)`);
  };
  return <>
    <div className="h-sec"><h2>Booking management</h2><div style={{ display: "flex", gap: 8 }}><button className="btn btn-ghost btn-sm" onClick={exportCsv}><Ic n="doc" s={15} /> Export CSV</button><button className="btn btn-primary btn-sm" onClick={() => startBooking({ source: "Admin (phone)" })}><Ic n="plus" s={15} /> Add booking</button></div></div>
    <div className="toolbar"><input placeholder="Search ID, name, phone, area…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
      <select value={f.city} onChange={e => setF({ ...f, city: e.target.value })}><option value="">All cities</option>{cityOpts(S).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select value={f.service} onChange={e => setF({ ...f, service: e.target.value })}><option value="">All services</option>{S.services.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
      <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
    <p className="muted small">{list.length} booking(s)</p><BookingTable list={list} />
  </>;
}
function ManageBooking({ id }: { id: string }) {
  const { S, update, closeModal, toast, openModal } = useStore();
  const b = S.bookings.find(x => x.id === id); if (!b) return null;
  const r = ranked(S, { service: b.service, city: b.city, duty: b.duty, lang: b.lang !== "Any" ? b.lang : "", area: b.area }, S.staff.filter(p => !["Pending", "Suspended", "Verification in Progress"].includes(p.status)));
  const reopen = () => openModal("Booking " + id, <ManageBooking id={id} />, true);
  const activities = [...b.history.map(h => ({ at: h.at, t: "Status → " + h.s, by: "System" })), ...(b.internal || [])].sort((a, c) => c.at.localeCompare(a.at));
  const save = (d: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    update(s => {
      const bb = s.bookings.find(x => x.id === id)!; const now = new Date().toISOString();
      const freeUp = (pid: string) => { const p = s.staff.find(x => x.id === pid); if (p && p.status === "Assigned" && !s.bookings.some(x => x !== bb && x.staff === pid && !["Completed", "Cancelled"].includes(x.status))) p.status = "Available"; };
      if (d.status !== bb.status) { bb.status = d.status; bb.history.push({ s: d.status, at: now }); if (d.status === "Cancelled") bb.cancelReq = false; }
      if (d.staff !== bb.staff) { if (bb.staff) freeUp(bb.staff); bb.staff = d.staff; const np = s.staff.find(p => p.id === d.staff); if (np && ["Booking Confirmed", "Service Started"].includes(bb.status)) np.status = "Assigned"; bb.internal.push({ at: now, by: "Admin", t: np ? "Assigned " + np.name : "Unassigned staff" }); }
      if (["Completed", "Cancelled"].includes(bb.status) && bb.staff) freeUp(bb.staff);
      bb.shortlist = d.shortlist || [];
      if (d.interviewAt !== (bb.interviewAt || "")) { bb.interviewAt = d.interviewAt; if (d.interviewAt) bb.internal.push({ at: now, by: "Admin", t: "Interview scheduled " + fmtDT(d.interviewAt) }); }
      bb.amountPaid = +d.amountPaid || 0; if ((d.note || "").trim()) bb.internal.push({ at: now, by: "Admin", t: d.note.trim() });
    });
    closeModal(); toast("Booking updated");
  };
  return <><div className="grid g2" style={{ gap: 18 }}>
    <div><table className="sumtbl small"><tbody>
      <tr><td>Customer</td><td>{b.name}<br />{b.phone}{b.email && <><br />{b.email}</>}</td></tr><tr><td>Address</td><td>{b.address || "—"}</td></tr>
      <tr><td>Service</td><td>{svcName(S, b.service)}{b.extra?.length ? " + " + b.extra.map(x => svcName(S, x)).join(", ") : ""}</td></tr>
      <tr><td>Location</td><td>{b.area || "—"}, {cityName(S, b.city)} {b.pin}</td></tr><tr><td>Duty</td><td>{dutyName(b.duty)}</td></tr>
      <tr><td>Household</td><td>{b.family || "—"} · {b.home || "—"}</td></tr><tr><td>Needs</td><td>{b.resp || "—"}</td></tr>
      <tr><td>Prefs</td><td>{b.lang} · {b.expReq} yrs · {b.gender}</td></tr><tr><td>Schedule</td><td>{b.date ? fmtDate(b.date) : "—"} · {(b.days || []).join(", ")} {b.start ? b.start + "–" + b.end : ""}</td></tr>
      <tr><td>Notes</td><td>{b.notes || "—"}</td></tr><tr><td>Source</td><td>{b.source}{b.coupon ? " · coupon " + b.coupon : ""}</td></tr>
      {b.cancelReq && <tr><td>Cancel request</td><td><span className="tag red">{b.cancelReason || "Requested"}</span></td></tr>}
    </tbody></table></div>
    <Form onData={save}>
      <Field name="status" label="Status" type="select" opts={STATUSES} value={b.status} placeholder={false} />
      <Field name="staff" label="Assign professional (ranked by smart match)" type="select" value={b.staff} placeholder="— Not assigned —" opts={r.map(x => [x.p.id, `${x.p.name} · ${x.p.role} · ${cityName(S, x.p.city)} · ${x.s}%${x.p.status === "Assigned" && b.staff !== x.p.id ? " (busy)" : ""}`])} />
      <FieldWrap name="shortlist" label="Shortlist for customer"><div style={{ display: "grid", gap: 6, maxHeight: 150, overflow: "auto" }}>{r.slice(0, 6).map(x => <label key={x.p.id} className="check"><input type="checkbox" name="shortlist" data-multi value={x.p.id} defaultChecked={(b.shortlist || []).includes(x.p.id)} /> {x.p.name} — {x.p.role} <span className="match">{x.s}%</span></label>)}</div></FieldWrap>
      <Field name="interviewAt" label="Interview date & time" type="datetime-local" value={b.interviewAt} />
      <Field name="amountPaid" label="Amount paid (₹)" type="number" min={0} value={b.amountPaid || 0} />
      <Field name="note" label="Add internal note" type="textarea" ph="Visible to admin team only" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn btn-navy">Save changes</button>
        {b.cancelReq && b.status !== "Cancelled" && <button type="button" className="btn btn-red" onClick={e => { const f = e.currentTarget.form!; (f.elements.namedItem("status") as HTMLSelectElement).value = "Cancelled"; f.requestSubmit(); }}>Approve cancellation</button>}
        {b.replaceReq && <button type="button" className="btn btn-ghost" onClick={() => { update(s => { s.bookings.find(x => x.id === id)!.replaceReq = false; }); toast("Replacement marked handled"); setTimeout(reopen, 0); }}>Mark replacement handled</button>}</div>
    </Form>
  </div>
    <h4 style={{ marginTop: 20 }}>Activity</h4><div className="small">{activities.map((n, i) => <div key={i} style={{ padding: "7px 0", borderBottom: "1px dashed var(--line)" }}><b>{n.by || "Admin"}</b> · {fmtDT(n.at)} — {n.t}</div>)}</div></>;
}

/* ---------- Staff ---------- */
function StaffTab() {
  const { S, update, toast, openModal } = useStore();
  return <>
    <div className="h-sec"><h2>Staff management</h2><button className="btn btn-primary btn-sm" onClick={() => openModal("Add staff", <EditStaff />, true)}><Ic n="plus" s={15} /> Add staff</button></div>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Professional</th><th>Role</th><th>City</th><th>Exp.</th><th>Verification</th><th>Status</th><th>Public</th><th></th></tr></thead><tbody>{S.staff.map(p => <tr key={p.id}>
      <td><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Avatar p={p} size={38} /><div><b>{p.fullName || p.name}</b> <DemoTag x={p} /><div className="muted small">{p.phone || "no phone"}</div></div></div></td>
      <td>{p.role}</td><td>{cityName(S, p.city)}<div className="muted small">{p.area}</div></td><td>{p.exp} yrs</td><td>{verCount(p)}/{VER_ITEMS.length}</td>
      <td><select value={p.status} onChange={e => { const v = e.target.value; update(s => { s.staff.find(x => x.id === p.id)!.status = v; }); toast(p.name + " → " + v); }}>{STAFF_ST.map(s => <option key={s}>{s}</option>)}</select></td>
      <td><input type="checkbox" checked={p.published} aria-label="Publish profile" onChange={e => { const v = e.target.checked; if (v && p.ver.id !== "Done") { toast("Complete identity verification before publishing."); return; } update(s => { s.staff.find(x => x.id === p.id)!.published = v; }); toast(v ? "Profile published" : "Profile hidden"); }} /></td>
      <td><button className="btn btn-ghost btn-sm" onClick={() => openModal("Edit " + p.name, <EditStaff id={p.id} />, true)}><Ic n="edit" s={14} /> Edit / verify</button></td>
    </tr>)}</tbody></table></div>
    <p className="muted small" style={{ marginTop: 10 }}>A profile is shown publicly only when &quot;Public&quot; is ticked and status is Approved, Available or Assigned.</p>
  </>;
}
function EditStaff({ id }: { id?: string }) {
  const { S, update, toast, closeModal } = useStore();
  const p: Staff = (id && S.staff.find(x => x.id === id)) || { id: "", name: "", role: "", group: "maid", services: [], exp: 0, skills: [], langs: [], hours: "", duty: [], city: "", area: "", gender: "Female", status: "Pending", ver: emptyVer(), published: false, phone: "", about: "", ratings: [] };
  return <Form onData={d => {
    const er: Errs = {}; if (!V.name(d.name)) er.name = 1; if (!V.req(d.role)) er.role = 1; if (Object.keys(er).length) return er;
    update(s => {
      let x = id ? s.staff.find(y => y.id === id) : undefined; if (!x) { x = { ...p, id: uid("pro-"), ratings: [], published: false }; s.staff.push(x); }
      Object.assign(x, { name: d.name.trim(), fullName: d.fullName.trim(), role: d.role.trim(), group: d.group, services: d.services || [], exp: +d.exp || 0, phone: normPhone(d.phone || ""), gender: d.gender, city: d.city, area: d.area, skills: d.skills.split(",").map((y: string) => y.trim()).filter(Boolean), hours: d.hours, langs: d.langs || [], duty: d.duty || [], about: d.about, status: d.status, ver: Object.fromEntries(VER_ITEMS.map(([k]) => [k, d["ver_" + k]])) });
      if (x.ver.id !== "Done") x.published = false;
    });
    closeModal(); toast("Staff saved");
  }}>
    {id && <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}><Avatar p={p} size={72} /><label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}><Ic n="plus" s={13} /> Upload photo<input type="file" accept="image/*" hidden onChange={e => readImg(e.target.files?.[0], 400, url => { update(s => { s.staff.find(x => x.id === id)!.photo = url; }); toast("Photo updated"); }, toast)} /></label>{p.photo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => update(s => { delete s.staff.find(x => x.id === id)!.photo; })}>Remove photo</button>}</div>}
    <div className="frow"><Field name="name" label="Display name (first name)" value={p.name} req err="Required" /><Field name="fullName" label="Full legal name (private)" value={p.fullName} /></div>
    <div className="frow"><Field name="role" label="Profession title" value={p.role} req err="Required" ph="e.g. Home Cook" /><Field name="group" label="Category" type="select" opts={groupOpts()} value={p.group} placeholder={false} /></div>
    <FieldWrap name="services" label="Services offered"><div className="days">{S.services.map(s => <label key={s.slug}><input type="checkbox" name="services" data-multi value={s.slug} defaultChecked={p.services.includes(s.slug)} /><span>{s.name}</span></label>)}</div></FieldWrap>
    <div className="frow3"><Field name="exp" label="Experience (yrs)" type="number" value={p.exp} /><Field name="phone" label="Phone (private)" value={p.phone} /><Field name="gender" label="Gender" type="select" opts={["Female", "Male", "Other"]} value={p.gender} placeholder={false} /></div>
    <div className="frow"><CityArea city={p.city} area={p.area} /></div>
    <Field name="skills" label="Skills (comma separated)" value={p.skills.join(", ")} /><Field name="hours" label="Preferred working hours" value={p.hours} />
    <FieldWrap name="langs" label="Languages"><div className="days">{["Gujarati", "Hindi", "English", "Marathi", "Bengali", "Odia", "Nepali", "Malayalam", "Tamil"].map(l => <label key={l}><input type="checkbox" name="langs" data-multi value={l} defaultChecked={p.langs.includes(l)} /><span>{l}</span></label>)}</div></FieldWrap>
    <FieldWrap name="duty" label="Duty types"><div className="days">{[["hourly", "Hourly"], ["part-time", "Part-time"], ["full-time", "Full-time"], ["live-in", "Live-in"]].map(([k, l]) => <label key={k}><input type="checkbox" name="duty" data-multi value={k} defaultChecked={p.duty.includes(k)} /><span>{l}</span></label>)}</div></FieldWrap>
    <Field name="about" label="Short public bio" type="textarea" value={p.about} />
    <h4>Verification</h4><div className="frow">{VER_ITEMS.map(([k, l]) => <Field key={k} name={"ver_" + k} label={l} type="select" opts={["Not started", "In progress", "Done", "Failed"]} value={p.ver[k]} placeholder={false} />)}</div>
    {p.iddocName && <div className="note info"><Ic n="id" s={18} /><div className="small">ID document recorded: <b>{p.iddocName}</b> (file not stored in this build)<br />Emergency: {p.emg || "—"} · Reference: {p.ref || "—"}<br />Address: {p.paddr || "—"} · Expected salary: {p.salary ? inr(p.salary) : "—"}{p.age ? ` · Age ${p.age}` : ""}</div></div>}
    <Field name="status" label="Status" type="select" opts={STAFF_ST} value={p.status} placeholder={false} />
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn btn-navy">Save</button>{id && <ConfirmBtn className="btn btn-red" onConfirm={() => { update(s => { s.staff = s.staff.filter(x => x.id !== id); }); closeModal(); toast("Staff removed"); }} />}</div>
  </Form>;
}

/* ---------- Services ---------- */
function ServicesTab() {
  const { S, update, toast, openModal } = useStore();
  return <>
    <div className="h-sec"><h2>Service management</h2><button className="btn btn-primary btn-sm" onClick={() => openModal("Add service", <EditService />, true)}><Ic n="plus" s={15} /> Add service</button></div>
    <p className="muted small">Leave price blank to show &quot;Quote on request&quot;. Prices appear on cards and service pages only when set.</p>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Service</th><th>Category</th><th>Starting price (₹)</th><th>Per</th><th>Active</th><th></th></tr></thead><tbody>{S.services.map((s, i) => <tr key={s.slug}>
      <td><b>{s.name}</b><div className="muted small">/services/{s.slug}</div></td><td>{GROUPS[s.group].n}</td>
      <td><input type="number" min={0} defaultValue={s.price} style={{ width: 110 }} onBlur={e => { const v = e.target.value; if (v !== s.price) { update(d => { d.services[i].price = v; }); toast("Price saved"); } }} /></td>
      <td><select value={s.unit} onChange={e => { const v = e.target.value; update(d => { d.services[i].unit = v; }); }}>{["month", "hour", "visit", "one-time"].map(u => <option key={u}>{u}</option>)}</select></td>
      <td><input type="checkbox" checked={s.active} onChange={e => { const v = e.target.checked; update(d => { d.services[i].active = v; }); toast(v ? "Service enabled" : "Service hidden"); }} /></td>
      <td><button className="btn btn-ghost btn-sm" onClick={() => openModal("Edit " + s.name, <EditService slug={s.slug} />, true)}><Ic n="edit" s={14} /> Edit</button></td>
    </tr>)}</tbody></table></div>
  </>;
}
function EditService({ slug }: { slug?: string }) {
  const { S, update, toast, closeModal } = useStore();
  const s = slug ? svcBy(S, slug) : undefined;
  const v = s || { slug: "", name: "", group: "maid" as Group, short: "", features: [], resp: [], cap: "", seoTitle: "", seoDesc: "", img: undefined };
  return <Form onData={d => {
    const er: Errs = {}; if (!V.req(d.name)) er.name = 1; if (!V.req(d.short)) er.short = 1; if (!slug && (!/^[a-z0-9-]+$/.test(d.slug || "") || svcBy(S, d.slug))) er.slug = 1; if (Object.keys(er).length) return er;
    update(st => {
      let x = slug ? st.services.find(y => y.slug === slug) : undefined;
      if (!x) { x = { slug: d.slug, name: "", group: "maid", short: "", features: [], resp: [], cap: "", price: "", unit: "month", active: true, seoTitle: "", seoDesc: "" }; st.services.push(x); }
      Object.assign(x, { name: d.name.trim(), group: d.group, short: d.short.trim(), features: d.features.split("\n").map((y: string) => y.trim()).filter(Boolean).slice(0, 3), resp: d.resp.split("\n").map((y: string) => y.trim()).filter(Boolean), cap: d.cap || d.name, seoTitle: d.seoTitle, seoDesc: d.seoDesc });
    });
    closeModal(); toast("Service saved");
  }}>
    <div className="frow"><Field name="name" label="Service name" value={v.name} req err="Required" /><Field name="group" label="Category" type="select" opts={groupOpts()} value={v.group} placeholder={false} /></div>
    {!slug && <Field name="slug" label="URL slug" ph="e.g. gardener" req err="Lowercase letters, numbers and hyphens only (must be unique)" />}
    <Field name="short" label="Short description" type="textarea" value={v.short} req err="Required" />
    <Field name="features" label="Key features (one per line, max 3 shown)" type="textarea" value={v.features.join("\n")} />
    <Field name="resp" label="Responsibilities (one per line)" type="textarea" value={v.resp.join("\n")} />
    {slug && s && <FieldWrap name="img" label="Service image" hint="4:3 landscape photo works best."><div style={{ display: "flex", gap: 12, alignItems: "center" }}><div className="ph" style={{ aspectRatio: "4/3", width: 140, borderRadius: 10 }}>{s.img ? <img src={s.img} alt="" /> : <Photo k={photoKey(s)} sizes="140px" fallback={<Scene k={sceneFor(s)} />} />}</div><div style={{ display: "grid", gap: 6 }}><label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}><Ic n="plus" s={13} /> Upload photo<input type="file" accept="image/*" hidden onChange={e => readImg(e.target.files?.[0], 900, url => { update(st => { st.services.find(y => y.slug === slug)!.img = url; }); toast("Service image updated"); }, toast)} /></label>{s.img && <button type="button" className="btn btn-ghost btn-sm" onClick={() => update(st => { delete st.services.find(y => y.slug === slug)!.img; })}>Use illustration</button>}</div></div></FieldWrap>}
    <Field name="cap" label="Image description / alt text" value={v.cap} hint="Used as the image alt text for accessibility and SEO." />
    <h4>SEO</h4>
    <Field name="seoTitle" label="SEO title" value={v.seoTitle} ph='Defaults to "<Service> in Ahmedabad & Gujarat"' />
    <Field name="seoDesc" label="Meta description" type="textarea" value={v.seoDesc} />
    <p className="muted small">Note: search-engine metadata is generated from the built-in data at build time; admin edits here change what visitors see in this browser.</p>
    <div style={{ display: "flex", gap: 8 }}><button className="btn btn-navy">Save</button>{slug && <ConfirmBtn className="btn btn-red" onConfirm={() => { update(st => { st.services = st.services.filter(x => x.slug !== slug); }); closeModal(); }} />}</div>
  </Form>;
}

/* ---------- Customers & support ---------- */
function Customers({ go }: { go: (t: string) => void }) {
  const { S, update } = useStore(); void go;
  const by: Record<string, { name: string; phone: string; city: string; list: typeof S.bookings }> = {};
  S.bookings.forEach(b => { (by[b.phone] ||= { name: b.name, phone: b.phone, city: b.city, list: [] }).list.push(b); });
  Object.values(S.customers).forEach(c => { by[c.phone] ||= { name: c.name, phone: c.phone, city: "", list: [] }; });
  const [reply, setReply] = useState<Record<string, string>>({});
  return <>
    <h2>Customers</h2>
    <div className="tbl-wrap" style={{ marginBottom: 28 }}><table className="tbl"><thead><tr><th>Customer</th><th>Phone</th><th>City</th><th>Bookings</th><th>Latest</th></tr></thead><tbody>{Object.values(by).map(c => <tr key={c.phone}><td><b>{c.name}</b></td><td>{c.phone}</td><td>{cityName(S, c.city)}</td><td>{c.list.length}</td><td>{c.list[0] ? <Badge st={c.list[0].status} /> : "—"}</td></tr>)}</tbody></table></div>
    <h2>Support tickets & contact messages</h2>
    {S.tickets.length ? S.tickets.map(x => <div key={x.id} className="card pad" style={{ marginBottom: 10 }}>
      <div className="h-sec"><div><b style={{ color: "var(--navy)" }}>{x.subject}</b> <span className="muted small">· {x.name || ""} · {x.phone} · {fmtDT(x.at)}{x.source ? " · " + x.source : ""}</span></div><Badge st={x.status} map={{ Open: "#c26a0a", Resolved: "#0f8a72" }} /></div>
      <p className="small">{x.msg}</p>
      {x.status === "Open" ? <div style={{ display: "flex", gap: 8 }}><input className="inp" style={{ flex: 1 }} value={reply[x.id] || ""} onChange={e => setReply({ ...reply, [x.id]: e.target.value })} placeholder="Reply / resolution note" /><button className="btn btn-green btn-sm" onClick={() => update(s => { const t = s.tickets.find(y => y.id === x.id)!; t.reply = reply[x.id] || ""; t.status = "Resolved"; })}>Resolve</button></div> : <div className="muted small">Reply: {x.reply || "—"}</div>}
    </div>) : <div className="card empty">No tickets yet.</div>}
  </>;
}

/* ---------- Locations ---------- */
function Locations() {
  const { S, update, toast } = useStore(); const [na, setNa] = useState<Record<number, string>>({});
  return <>
    <div className="h-sec"><h2>Location management</h2></div>
    <Form className="card pad" style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }} onData={(d, f) => {
      const n = (d.cn || "").trim(); if (n.length < 2) return { cn: 1 }; const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, ""); if (cityBy(S, slug)) { toast("City exists"); return; }
      update(s => { s.cities.push({ slug, name: n, areas: [], pins: "", active: true }); }); f.reset();
    }}><Field name="cn" label="Add city" ph="e.g. Navsari" err="Enter a city name" style={{ margin: 0, flex: 1 }} /><button className="btn btn-primary"><Ic n="plus" s={15} /> Add city</button></Form>
    {S.cities.map((c, i) => <div key={c.slug} className="card pad" style={{ marginBottom: 12 }}>
      <div className="h-sec"><h3 style={{ fontSize: 18 }}>{c.name} <span className="muted small">/locations/{c.slug}</span></h3><label className="check"><input type="checkbox" checked={c.active} onChange={e => { const v = e.target.checked; update(s => { s.cities[i].active = v; }); }} /> Active</label></div>
      <div className="chips" style={{ marginBottom: 10 }}>{c.areas.map((a, j) => <span key={a} className="chip">{a} <button style={{ border: 0, background: "none", cursor: "pointer", color: "var(--red)" }} onClick={() => update(s => { s.cities[i].areas.splice(j, 1); })} aria-label={`Remove ${a}`}>×</button></span>)}</div>
      <div className="frow"><div style={{ display: "flex", gap: 8 }}><input className="inp" style={{ flex: 1 }} value={na[i] || ""} onChange={e => setNa({ ...na, [i]: e.target.value })} placeholder="Add area" /><button className="btn btn-ghost btn-sm" onClick={() => { const v = (na[i] || "").trim(); if (v) { update(s => { s.cities[i].areas.push(v); }); setNa({ ...na, [i]: "" }); } }}>Add</button></div>
        <input className="inp" defaultValue={c.pins} placeholder="Serviceable PIN codes, comma separated" onBlur={e => { const v = e.target.value; if (v !== c.pins) { update(s => { s.cities[i].pins = v; }); toast("PIN codes saved"); } }} /></div>
    </div>)}
  </>;
}

/* ---------- Content ---------- */
function Content() {
  const { S, update, toast } = useStore(); const st = S.stats;
  return <>
    <h2>Content management</h2>
    <Slides />
    <Form className="card pad" style={{ marginBottom: 18 }} onData={d => { update(s => { s.content.ctaT = d.ctaT; s.content.ctaS = d.ctaS; }); toast("Homepage content saved"); }}>
      <h3 style={{ fontSize: 17 }}>Final call-to-action banner</h3>
      <Field name="ctaT" label="Final CTA heading" value={S.content.ctaT} /><Field name="ctaS" label="Final CTA description" type="textarea" value={S.content.ctaS} />
      <button className="btn btn-navy btn-sm">Save</button></Form>
    <Form className="card pad" style={{ marginBottom: 18 }} onData={d => { update(s => { Object.assign(s.stats, { pros: d.pros, families: d.families, years: d.years, cities: d.cities, placements: d.placements }); }); toast("Statistics saved"); }}>
      <h3 style={{ fontSize: 17 }}>Trust statistics</h3><p className="muted small">Publish only figures you can substantiate. Blank fields show &quot;—&quot;.</p>
      <div className="frow3"><Field name="pros" label="Verified professionals" value={st.pros} ph="e.g. 250+" /><Field name="families" label="Happy families" value={st.families} /><Field name="years" label="Years of experience" value={st.years} /><Field name="cities" label="Cities served" value={st.cities} /><Field name="placements" label="Successful placements" value={st.placements} /></div>
      <button className="btn btn-navy btn-sm">Save</button></Form>
    <div className="card pad" style={{ marginBottom: 18 }}><h3 style={{ fontSize: 17 }}>Reviews moderation</h3>{S.reviews.map(r => <div key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <div className="h-sec" style={{ marginBottom: 6 }}><span><Stars n={r.rating} s={14} /> <b>{r.name}</b> · {r.city} · {svcName(S, r.service)} <DemoTag x={r} /> {r.booking && <span className="tag">Verified booking {r.booking}</span>}</span><Badge st={r.status} map={{ approved: "#0f8a72", pending: "#c26a0a", rejected: "#dc2626" }} /></div>
      <p className="small" style={{ margin: "0 0 8px" }}>{r.text}</p>
      <div style={{ display: "flex", gap: 6 }}>{r.status !== "approved" && <button className="btn btn-green btn-sm" onClick={() => update(s => { s.reviews.find(x => x.id === r.id)!.status = "approved"; })}>Approve</button>}{r.status !== "rejected" && <button className="btn btn-ghost btn-sm" onClick={() => update(s => { s.reviews.find(x => x.id === r.id)!.status = "rejected"; })}>Reject</button>}<button className="btn btn-red btn-sm" onClick={() => update(s => { s.reviews = s.reviews.filter(x => x.id !== r.id); })}>Delete</button></div>
    </div>)}</div>
    <div className="card pad" style={{ marginBottom: 18 }}><h3 style={{ fontSize: 17 }}>FAQs</h3>{S.faqs.map(f => <div key={f.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", display: "flex", gap: 10, justifyContent: "space-between" }}><div><b className="small">{f.q}</b><div className="muted small">{f.a}</div></div><button className="xbtn" onClick={() => update(s => { s.faqs = s.faqs.filter(x => x.id !== f.id); })} aria-label="Delete FAQ"><Ic n="trash" s={15} /></button></div>)}
      <Form style={{ marginTop: 12 }} onData={(d, f) => { if (!d.q || !d.a) return { q: !d.q, a: !d.a }; update(s => { s.faqs.push({ id: uid("f"), q: d.q, a: d.a }); }); f.reset(); }}><Field name="q" label="New question" err="Required" /><Field name="a" label="Answer" type="textarea" err="Required" /><button className="btn btn-ghost btn-sm"><Ic n="plus" s={14} /> Add FAQ</button></Form></div>
    <div className="card pad"><h3 style={{ fontSize: 17 }}>Blog articles</h3>{S.blog.map(b => <div key={b.slug} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10 }}><span><Link className="link" href={`/blog/${b.slug}`}>{b.title}</Link> <span className="muted small">{fmtDate(b.date)}</span></span><button className="xbtn" onClick={() => update(s => { s.blog = s.blog.filter(x => x.slug !== b.slug); })} aria-label="Delete article"><Ic n="trash" s={15} /></button></div>)}
      <Form style={{ marginTop: 12 }} onData={(d, f) => {
        if (!d.title || !d.body) return { title: !d.title, body: !d.body };
        const slug = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
        if (S.blog.some(b => b.slug === slug)) return { title: 1 };
        update(s => { s.blog.unshift({ slug, title: d.title, cat: d.cat || "Guide", date: today(), excerpt: d.body.slice(0, 140), body: d.body.split(/\n\s*\n/) }); }); f.reset(); toast("Article published");
      }}><div className="frow"><Field name="title" label="Title" err="Required (and must be unique)" /><Field name="cat" label="Category" ph="Hiring guide" /></div><Field name="body" label="Body (blank line between paragraphs)" type="textarea" rows={6} err="Required" /><button className="btn btn-ghost btn-sm"><Ic n="plus" s={14} /> Publish article</button></Form></div>
  </>;
}
function Slides() {
  const { S, update, toast } = useStore();
  const linkOpts: [string, string][] = [["book", "Booking form (any service)"], ["services", "All services page"], ...S.services.map(s => ["book:" + s.slug, "Book: " + s.name] as [string, string]), ...S.services.map(s => ["service-" + s.slug, "Page: " + s.name] as [string, string])];
  const set = (i: number, patch: Record<string, unknown>) => update(s => { Object.assign(s.slides[i], patch); });
  const move = (i: number, dir: number) => update(s => { const j = i + dir; if (j < 0 || j >= s.slides.length) return; [s.slides[i], s.slides[j]] = [s.slides[j], s.slides[i]]; });
  const inp = { padding: 9, border: "1px solid #d5dde7", borderRadius: 9, font: "inherit", fontSize: 14 };
  return <div className="card pad" style={{ marginBottom: 18 }}>
    <div className="h-sec"><h3 style={{ fontSize: 17, margin: 0 }}>Homepage banner slider</h3><div style={{ display: "flex", gap: 8, alignItems: "center" }}><label className="small" htmlFor="sl-sec">Change every</label><input id="sl-sec" type="number" min={3} max={20} defaultValue={S.sliderSec || 6} style={{ ...inp, width: 70 }} onBlur={e => { update(s => { s.sliderSec = Math.min(20, Math.max(3, +e.target.value || 6)); }); toast("Slider speed saved"); }} /><span className="small">sec</span><button className="btn btn-primary btn-sm" onClick={() => update(s => { s.slides.push({ id: uid("s"), scene: "family", eyebrow: "New slide", title: "Your headline with *highlight*", sub: "Short supporting line.", cta: "Book a Service", link: "book", active: true }); })}><Ic n="plus" s={14} /> Add slide</button></div></div>
    <p className="muted small">Each slide shows a stock photo matching its picture type (dropdown). Upload your own photo (16:9 landscape works best) to replace it. Wrap words in *stars* to highlight them.</p>
    {S.slides.map((x, i) => <div key={x.id} className="slide-row" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, padding: "16px 0", borderTop: "1px solid var(--line)" }}>
      <div><div className="ph" style={{ aspectRatio: "16/10", borderRadius: 12 }}>{x.img ? <img src={x.img} alt="" /> : <Photo k={x.scene} sizes="200px" fallback={<Scene k={x.scene} />} />}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}><label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}><Ic n="plus" s={13} /> Photo<input type="file" accept="image/*" hidden onChange={e => readImg(e.target.files?.[0], 1400, url => { set(i, { img: url }); toast("Slide image updated"); }, toast)} /></label>{x.img && <button className="btn btn-ghost btn-sm" onClick={() => update(s => { delete s.slides[i].img; })}>Remove</button>}</div>
        {!x.img && <select style={{ ...inp, marginTop: 6, width: "100%" }} value={x.scene} onChange={e => set(i, { scene: e.target.value })}>{Object.keys(SCENES).map(k => <option key={k}>{k}</option>)}</select>}</div>
      <div>
        <div className="frow"><input style={inp} defaultValue={x.eyebrow} placeholder="Small label" onBlur={e => set(i, { eyebrow: e.target.value })} /><input style={inp} defaultValue={x.cta} placeholder="Button text" onBlur={e => set(i, { cta: e.target.value })} /></div>
        <input style={{ ...inp, width: "100%", margin: "8px 0", fontWeight: 600 }} defaultValue={x.title} placeholder="Headline" onBlur={e => set(i, { title: e.target.value })} />
        <textarea style={{ ...inp, width: "100%" }} rows={2} defaultValue={x.sub} onBlur={e => set(i, { sub: e.target.value })} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
          <select style={{ ...inp, maxWidth: 260 }} value={x.link} onChange={e => set(i, { link: e.target.value })}>{linkOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <label className="check"><input type="checkbox" checked={x.active} onChange={e => set(i, { active: e.target.checked })} /> Show</label>
          <button className="xbtn" onClick={() => move(i, -1)} aria-label="Move up">↑</button><button className="xbtn" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
          <button className="xbtn" onClick={() => { if (S.slides.length > 1) update(s => { s.slides.splice(i, 1); }); }} aria-label="Delete slide"><Ic n="trash" s={15} /></button>
        </div>
      </div>
    </div>)}
  </div>;
}

/* ---------- Marketing ---------- */
function Marketing() {
  const { S, update, toast } = useStore();
  const src: Record<string, number> = {}; S.bookings.forEach(b => { src[b.source] = (src[b.source] || 0) + 1; });
  return <>
    <h2>Marketing</h2>
    <div className="card pad" style={{ marginBottom: 18 }}><h3 style={{ fontSize: 17 }}>Coupon codes</h3>
      <div className="tbl-wrap" style={{ marginBottom: 12 }}><table className="tbl" style={{ minWidth: 480 }}><thead><tr><th>Code</th><th>Discount</th><th>Uses</th><th>Active</th><th></th></tr></thead><tbody>{S.coupons.map((c, i) => <tr key={c.code}><td><b>{c.code}</b> <DemoTag x={c} /></td><td>{c.type === "percent" ? c.value + "%" : inr(c.value)}</td><td>{S.bookings.filter(b => b.coupon === c.code).length}</td><td><input type="checkbox" checked={c.active} onChange={e => { const v = e.target.checked; update(s => { s.coupons[i].active = v; }); }} /></td><td><button className="xbtn" onClick={() => update(s => { s.coupons.splice(i, 1); })} aria-label="Delete coupon"><Ic n="trash" s={15} /></button></td></tr>)}</tbody></table></div>
      <Form className="frow3" style={{ alignItems: "end" }} onData={(d, f) => { const code = (d.code || "").trim().toUpperCase(); if (!/^[A-Z0-9]{3,15}$/.test(code) || S.coupons.some(c => c.code === code)) return { code: 1 }; if (!(+d.value > 0)) return { value: 1 }; update(s => { s.coupons.push({ code, type: d.type, value: +d.value, active: true }); }); f.reset(); }}>
        <Field name="code" label="Code" ph="DIWALI15" err="3–15 letters/numbers, unique" /><Field name="type" label="Type" type="select" opts={[["percent", "% off"], ["flat", "₹ off"]]} placeholder={false} />
        <div style={{ display: "flex", gap: 8, alignItems: "end" }}><Field name="value" label="Value" type="number" err="Enter a value" /><button className="btn btn-primary" style={{ marginBottom: 14 }}>Add</button></div></Form></div>
    <div className="grid g2" style={{ marginBottom: 18 }}>
      <div className="card pad"><h3 style={{ fontSize: 17 }}>Referral programme</h3><div className="field"><label htmlFor="rc">Credit per successful referral (₹)</label><input id="rc" type="number" defaultValue={S.settings.referralCredit} onBlur={e => { update(s => { s.settings.referralCredit = e.target.value; }); toast("Saved"); }} /></div><p className="muted small">Each customer gets a unique code in their dashboard.</p></div>
      <div className="card pad"><h3 style={{ fontSize: 17 }}>Lead sources</h3><div className="bars">{Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, v]) => barRow(k, v, S.bookings.length))}</div></div>
    </div>
    <div className="card pad" style={{ marginBottom: 18 }}><h3 style={{ fontSize: 17 }}>Subscription plans</h3>{S.plans.map((p, i) => <div key={p.id} className="frow" style={{ alignItems: "center", borderBottom: "1px solid var(--line)", padding: "8px 0" }}><b>{p.name}</b><input className="inp" type="number" placeholder="Monthly price (blank = quote)" defaultValue={p.price} onBlur={e => { update(s => { s.plans[i].price = e.target.value; }); toast("Plan price saved"); }} /></div>)}</div>
    <div className="card pad"><div className="h-sec"><h3 style={{ fontSize: 17, margin: 0 }}>Newsletter subscribers ({S.subscribers.length})</h3>{S.subscribers.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => copyText(S.subscribers.map(s => s.email).join("\n"), toast)}><Ic n="copy" s={14} /> Copy emails</button>}</div>
      {S.subscribers.length ? S.subscribers.map(s => <div key={s.email} className="small" style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>{s.email} <span className="muted">· {fmtDate(s.at)}</span></div>) : <p className="muted small">No subscribers yet.</p>}</div>
  </>;
}

/* ---------- Reports ---------- */
function Reports() {
  const { S } = useStore(); const B = S.bookings, n = B.length;
  const cnt = (f: (b: (typeof B)[number]) => string) => { const m: Record<string, number> = {}; B.forEach(b => { const k = f(b); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const conv = n ? Math.round(B.filter(b => ["Booking Confirmed", "Service Started", "Completed"].includes(b.status)).length / n * 100) : 0;
  const perf = S.staff.map(p => ({ p, jobs: B.filter(b => b.staff === p.id).length, done: B.filter(b => b.staff === p.id && b.status === "Completed").length, avg: p.ratings.length ? (p.ratings.reduce((a, c) => a + c, 0) / p.ratings.length).toFixed(1) : "—" })).filter(x => x.jobs).sort((a, b) => b.jobs - a.jobs);
  return <>
    <h2>Reports</h2>
    <div className="kpis">{kpi("Enquiries", n, "doc")}{kpi("Conversion rate", conv + "%", "chart", "#0f8a72")}{kpi("Completed", B.filter(b => b.status === "Completed").length, "check")}{kpi("Cancelled", B.filter(b => b.status === "Cancelled").length, "x", "#dc2626")}{kpi("Revenue", inr(B.reduce((a, b) => a + (+b.amountPaid || 0), 0)), "rupee")}</div>
    <div className="grid g2">
      <div className="card pad"><h3 style={{ fontSize: 17 }}>City-wise enquiries</h3><div className="bars">{cnt(b => cityName(S, b.city)).map(([k, v]) => barRow(k, v, n))}</div></div>
      <div className="card pad"><h3 style={{ fontSize: 17 }}>Service-wise enquiries</h3><div className="bars">{cnt(b => svcName(S, b.service)).slice(0, 10).map(([k, v]) => barRow(k, v, n))}</div></div>
      <div className="card pad"><h3 style={{ fontSize: 17 }}>Booking funnel</h3><div className="bars">{STATUSES.map(s => barRow(s, B.filter(b => b.status === s).length, n))}</div></div>
      <div className="card pad"><h3 style={{ fontSize: 17 }}>Staff performance</h3>{perf.length ? <table className="sumtbl small"><tbody><tr><td><b>Professional</b></td><td><b>Assigned · Completed · Rating</b></td></tr>{perf.map(x => <tr key={x.p.id}><td>{x.p.name} <span className="muted">({x.p.role})</span></td><td>{x.jobs} · {x.done} · {x.avg}</td></tr>)}</tbody></table> : <p className="muted small">No assignments yet.</p>}</div>
    </div>
  </>;
}

/* ---------- Settings ---------- */
function SettingsTab() {
  const { S, update, toast, replaceState } = useStore(); const s = S.settings;
  return <>
    <h2>Settings</h2>
    <Form className="card pad" onData={d => {
      const er: Errs = {}; if (!V.req(d.brand)) er.brand = 1; if (!V.email(d.email)) er.email = 1; if ((d.adminPin || "").length < 6) er.adminPin = 1; if (Object.keys(er).length) return er;
      update(x => { Object.assign(x.settings, { brand: d.brand, hours: d.hours, phone: d.phone, wa: d.wa, email: d.email, availability: d.availability, address: d.address, urgentNote: d.urgentNote, fb: d.fb, ig: d.ig, li: d.li, yt: d.yt, razorpay: d.razorpay, notifyEmail: d.notifyEmail, notifySms: d.notifySms, notifyWa: d.notifyWa, adminPin: d.adminPin }); });
      toast("Settings saved");
    }}>
      <h3 style={{ fontSize: 17 }}>Business</h3>
      <div className="frow"><Field name="brand" label="Brand name" value={s.brand} req err="Required" /><Field name="hours" label="Working hours" value={s.hours} /></div>
      <div className="frow"><Field name="phone" label="Support phone" value={s.phone} ph="+91 98XXX XXXXX" /><Field name="wa" label="WhatsApp Business number" value={s.wa} ph="91XXXXXXXXXX (with country code)" /></div>
      <div className="frow"><Field name="email" label="Email" type="email" value={s.email} err="Enter a valid email" /><Field name="availability" label="Service availability line" value={s.availability} /></div>
      <Field name="address" label="Business address" type="textarea" value={s.address} />
      <Field name="urgentNote" label="Urgent enquiry response message" type="textarea" value={s.urgentNote} />
      <h3 style={{ fontSize: 17 }}>Social links</h3>
      <div className="frow"><Field name="fb" label="Facebook URL" value={s.fb} /><Field name="ig" label="Instagram URL" value={s.ig} /><Field name="li" label="LinkedIn URL" value={s.li} /><Field name="yt" label="YouTube URL" value={s.yt} /></div>
      <h3 style={{ fontSize: 17 }}>Payments & notifications</h3>
      <Field name="razorpay" label="Razorpay Key ID" value={s.razorpay} ph="rzp_live_…" hint="Saved for later. Online payments need a backend to create orders and verify signatures — never put the key secret here." />
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}><label className="check"><input type="checkbox" name="notifyEmail" defaultChecked={s.notifyEmail} /> Email notifications</label><label className="check"><input type="checkbox" name="notifySms" defaultChecked={s.notifySms} /> SMS notifications</label><label className="check"><input type="checkbox" name="notifyWa" defaultChecked={s.notifyWa} /> WhatsApp notifications</label></div>
      <h3 style={{ fontSize: 17 }}>Security</h3>
      <Field name="adminPin" label="Admin password" type="password" value={s.adminPin} req err="Minimum 6 characters" />
      <button className="btn btn-navy">Save settings</button>
    </Form>
    <div className="card pad" style={{ marginTop: 18 }}><h3 style={{ fontSize: 17 }}>Data</h3><p className="muted small">This frontend-only build stores data in this browser. Remove demo records before going live.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { update(x => { x.bookings = x.bookings.filter(b => !b.demo); x.reviews = x.reviews.filter(r => !r.demo); x.staff = x.staff.filter(p => !p.demo); x.coupons = x.coupons.filter(c => !c.demo); }); toast("Demo data removed"); }}>Remove all demo data</button>
        <button className="btn btn-ghost btn-sm" onClick={() => copyText(JSON.stringify(S, null, 1), toast)}><Ic n="copy" s={14} /> Copy data as JSON</button>
        <ConfirmBtn label="Reset to fresh demo" onConfirm={() => { const pin = S.settings.adminPin; const f = seed(); f.settings.adminPin = pin; replaceState(f); toast("Reset done"); }} />
      </div></div>
  </>;
}
