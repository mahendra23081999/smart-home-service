export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const BRAND = "Smart Home Service";

// Business contact details (also editable in Admin → Settings).
export const PHONE = "+91 96363 26949";        // shown on the site; click-to-call uses tel:+919636326949
export const WHATSAPP = "919636326949";         // wa.me number: country code + number, digits only
export const EMAIL = "smarthomeserviceahmedabad@gmail.com";

// Office address
export const ADDR = {
  street: "Shop No. 4th-405, Shanti Arcade, Opp. Pushpak Apartment, Nr. Akash-3, 132 Feet Ring Road",
  locality: "Naranpura", city: "Ahmedabad", region: "Gujarat", pin: "380013", country: "IN",
};
export const ADDRESS = `${ADDR.street}, ${ADDR.locality}, ${ADDR.city}, ${ADDR.region} ${ADDR.pin}`;
/** Google Maps links built from an address (no API key needed). */
export const mapsLink = (a: string) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(a);
export const mapsEmbed = (a: string) => "https://maps.google.com/maps?q=" + encodeURIComponent(a) + "&z=16&output=embed";
