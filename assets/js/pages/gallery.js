import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML } from "../app.js";

async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("gallery.html");

  const g = await getJSON("content/settings/global.json");
  const primaryId = (g.primaryApartmentId || "apartma1");
  const ap = await getJSON(`content/apartments/${primaryId}.json`);

  qs("#gTitle").textContent = ap.name ? `Gallery — ${ap.name}` : "Gallery";
  qs("#gSub").textContent = ap.landingSubtitle || ap.teaser || "Photos of the apartment.";
  qs("#gBook").href = ap.bookingUrl || g.bookingUrl || "#";

  const imgs = (ap.gallery || []);
  qs("#gallery").innerHTML = imgs.map(src => `<img class="fade" src="${src}" alt="Photo">`).join("")
    || `<div class="small">Add photos to the gallery list in <code>content/apartments/${escapeHTML(primaryId)}.json</code>.</div>`;

  await mountFooter(); mountFadeIns();
}
main();
