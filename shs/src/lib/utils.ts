import { DUTY, PHOTOS, VER_ITEMS, type State, type Service, type Staff } from "./data";

export const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const fmtDT = (iso?: string) => iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
export const inr = (n: number | string) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const normPhone = (v: string) => (v || "").replace(/\D/g, "").slice(-10);
export function newId() { const d = new Date(); const p = (n: number) => String(n).padStart(2, "0"); return "GM-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(); }
export const otp = () => String(Math.floor(100000 + Math.random() * 900000));

export const V = {
  name: (v = "") => v.trim().length >= 2,
  phone: (v = "") => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").slice(-10)) && v.replace(/\D/g, "").length >= 10,
  email: (v = "") => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  emailReq: (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  pin: (v = "") => !v || /^[1-9]\d{5}$/.test(v.trim()),
  req: (v: unknown) => String(v ?? "").trim().length > 0,
};

export const svcBy = (S: State, s?: string) => S.services.find(x => x.slug === s);
export const cityBy = (S: State, s?: string) => S.cities.find(x => x.slug === s);
export const cityName = (S: State, s?: string) => cityBy(S, s)?.name || s || "—";
export const svcName = (S: State, s?: string) => svcBy(S, s)?.name || s || "—";
export const dutyName = (k?: string) => DUTY.find(d => d.k === k)?.n || k || "—";
export const activeSvcs = (S: State) => S.services.filter(s => s.active);
export const activeCities = (S: State) => S.cities.filter(c => c.active);
export const cityOpts = (S: State): [string, string][] => activeCities(S).map(c => [c.slug, c.name]);
export const areaOpts = (S: State, city?: string): [string, string][] => (cityBy(S, city)?.areas || []).map(a => [a, a]);
export const priceText = (s?: Service) => s && s.price ? `From ${inr(s.price)}${s.unit && s.unit !== "one-time" ? "/" + s.unit : ""}` : "";
export const sceneFor = (s?: { scene?: string; slug?: string; group?: string }) => !s ? "maid" : s.scene || (s.slug === "office-boy" ? "office" : ({ maid: "maid", clean: "clean", cook: "cook", child: "child", care: "care", driver: "driver" } as Record<string, string>)[s.group || ""] || "maid");

/** Each service has its own stock photo (PHOTOS in lib/data.ts); new services fall back to their group's photo. */
export const photoKey = (s?: { slug?: string; group?: string; scene?: string }) => (s?.slug && PHOTOS[s.slug] ? s.slug : sceneFor(s));

export const verCount = (p: Staff) => VER_ITEMS.filter(([k]) => p.ver?.[k] === "Done").length;
export const availText = (p: Staff) => p.status === "Available" ? "Available now" : p.status === "Assigned" ? "Currently assigned" : p.status;
export const publicStaff = (S: State) => S.staff.filter(p => p.published && ["Approved", "Available", "Assigned"].includes(p.status));

export interface MatchReq { service?: string; group?: string; city?: string; area?: string; duty?: string; lang?: string; exp?: string; gender?: string }
export function matchScore(S: State, p: Staff, r: MatchReq) {
  let sc = 0, max = 0; const w = (c: boolean, pts: number) => { max += pts; if (c) sc += pts; };
  if (r.service) { const sv = svcBy(S, r.service); w(p.services.includes(r.service) || !!(sv && p.group === sv.group), 35); }
  if (r.group) w(p.group === r.group, 35);
  if (r.city) w(p.city === r.city, 20);
  if (r.area) w(p.area === r.area, 5);
  if (r.duty) w(p.duty.includes(r.duty), 15);
  if (r.lang) w(p.langs.includes(r.lang), 10);
  if (r.exp) w(p.exp >= Number(r.exp), 10);
  if (r.gender && r.gender !== "No preference") w(p.gender === r.gender, 5);
  w(p.status === "Available", 10);
  w(verCount(p) === VER_ITEMS.length, 5);
  return max ? Math.round(sc / max * 100) : 0;
}
export const ranked = (S: State, r: MatchReq, list?: Staff[]) => (list || publicStaff(S)).map(p => ({ p, s: matchScore(S, p, r) })).sort((a, b) => b.s - a.s);

/** Read a form into a plain object. Checkboxes with data-multi collect into arrays; others become booleans. */
export type FD = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export function readForm(form: HTMLFormElement): FD {
  const d: FD = {};
  form.querySelectorAll<HTMLInputElement>("[name]").forEach(el => {
    if (el.type === "checkbox") {
      if (el.dataset.multi !== undefined) { (d[el.name] = d[el.name] || []); if (el.checked) d[el.name].push(el.value); }
      else d[el.name] = el.checked;
    } else if (el.type === "radio") { if (el.checked) d[el.name] = el.value; }
    else if (el.type === "file") d[el.name] = el.files?.[0]?.name || "";
    else d[el.name] = el.value;
  });
  return d;
}

/** Resize an uploaded image in the browser and return a data URL (cloud storage replaces this with a backend). */
export function readImg(file: File | undefined, maxW: number, cb: (url: string) => void, onErr: (m: string) => void) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { onErr("Please choose an image file (JPG, PNG or WebP)."); return; }
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const sc = Math.min(1, maxW / im.width); const c = document.createElement("canvas");
      c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
      c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
      let out = ""; try { out = c.toDataURL("image/webp", .8); } catch { /* ignore */ }
      if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", .82);
      cb(out);
    };
    im.onerror = () => onErr("Could not read that image.");
    im.src = r.result as string;
  };
  r.readAsDataURL(file);
}

export const routeForLink = (link: string) => link.startsWith("service-") ? "/services/" + link.slice(8) : link === "services" ? "/services" : "/" + link;
export const landingSlug = (svc: string, city: string) => `/${svc}-in-${city}`;
