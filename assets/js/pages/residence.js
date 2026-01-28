import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML } from "../app.js";
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("residence.html");
  const page = await getJSON("content/pages/residence.json");
  qs("#title").textContent = page.hero?.title || "The Residence";
  qs("#sub").textContent = page.hero?.subtitle || "";
  qs("#blocks").innerHTML = (page.blocks||[]).map(b=>`
    <div class="card fade" style="padding:16px">
      <div class="badge"><span class="dot"></span>${escapeHTML(b.title||"")}</div>
      <div class="p" style="margin-top:10px">${escapeHTML(b.text||"")}</div>
    </div>`).join("");
  qs("#gallery").innerHTML = (page.gallery||[]).slice(0,9).map(src=> `<img class="fade" src="${src}" alt="Residence">`).join("");
  qs("#tour").src = page.tourEmbedUrl || "";
  await mountFooter(); mountFadeIns();
}
main();