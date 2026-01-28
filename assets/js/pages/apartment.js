import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML } from "../app.js";
function param(name){ return new URLSearchParams(location.search).get(name); }
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("apartments.html");
  const id = param("id") || "apartma1";
  const ap = await getJSON(`content/apartments/${id}.json`);
  qs("#title").textContent = ap.name || "";
  qs("#sub").textContent = ap.teaser || "";
  qs("#desc").textContent = ap.description || "";
  qs("#meta").innerHTML = `<div class="pills">
    ${ap.size? `<span class="pill">${escapeHTML(ap.size)}</span>`:""}
    ${ap.maxGuests? `<span class="pill">${escapeHTML(String(ap.maxGuests))} guests</span>`:""}
    ${ap.beds? `<span class="pill">${escapeHTML(ap.beds)}</span>`:""}
  </div>`;
  qs("#book").href = ap.bookingUrl || (await getJSON("content/settings/global.json")).bookingUrl;
  qs("#gallery").innerHTML = (ap.gallery||[]).slice(0,9).map(src=> `<img class="fade" src="${src}" alt="Gallery">`).join("");
  await mountFooter(); mountFadeIns();
}
main();