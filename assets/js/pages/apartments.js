import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML } from "../app.js";
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("apartments.html");
  const idx = await getJSON("content/apartments/index.json");
  const aps = await Promise.all((idx.list||[]).map(id=> getJSON(`content/apartments/${id}.json`)));
  qs("#grid").innerHTML = aps.map(ap=>`
    <a class="card ap-card fade" href="apartment.html?id=${encodeURIComponent(ap.id)}">
      <div class="img"><img src="${ap.gallery?.[0] || "assets/media/images/01.jpg"}" alt="${escapeHTML(ap.name||"Apartment")}"></div>
      <div class="body">
        <div class="badge"><span class="dot"></span>${escapeHTML(ap.size||"")}${ap.maxGuests? " • "+escapeHTML(String(ap.maxGuests))+" guests":""}</div>
        <div class="name">${escapeHTML(ap.name||"")}</div>
        <p class="teaser">${escapeHTML(ap.teaser||"")}</p>
        <div class="pills">${(ap.highlights||[]).slice(0,4).map(x=> `<span class="pill">${escapeHTML(x)}</span>`).join("")}</div>
      </div>
    </a>`).join("");
  await mountFooter(); mountFadeIns();
}
main();