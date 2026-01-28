import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs } from "../app.js";
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("policies.html");
  const r = await fetch("content/pages/policies.md", {cache:"no-store"});
  const md = r.ok ? await r.text() : "# Policies";
  const html = md
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^\- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, m => "<ul>"+m+"</ul>")
    .replace(/\n\n/g, "</p><p>");
  qs("#content").innerHTML = `<div class="card fade" style="padding:18px"><p>${html}</p></div>`;
  await mountFooter(); mountFadeIns();
}
main();