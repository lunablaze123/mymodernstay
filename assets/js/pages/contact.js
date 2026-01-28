import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, toast } from "../app.js";
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("contact.html");
  const p = await getJSON("content/pages/contact.json");
  qs("#title").textContent = p.hero?.title || "Contact";
  qs("#sub").textContent = p.hero?.subtitle || "";
  qs("#name").textContent = p.contact?.name || "";
  qs("#email").textContent = p.contact?.email || "";
  qs("#phone").textContent = p.contact?.phone || "";
  qs("#addr").textContent = p.contact?.address || "";
  qs("#notice").textContent = p.form?.notice || "";
  qs("#form").addEventListener("submit",(e)=>{ e.preventDefault(); toast("Ta demo obrazec ne pošilja emaila. Če želiš, dodam Netlify Forms."); });
  await mountFooter(); mountFadeIns();
}
main();