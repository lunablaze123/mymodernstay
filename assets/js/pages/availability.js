import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs } from "../app.js";
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("availability.html");
  const b = await getJSON("content/settings/booking.json");
  qs("#title").textContent = b.headline || "Availability";
  qs("#sub").textContent = b.subline || "";
  qs("#openBooking").href = b.bookingUrl || "#";
  const frame = qs("#frame");
  if(b.embed){ frame.src = b.bookingUrl || ""; frame.style.display="block"; }
  else { frame.style.display="none"; }
  await mountFooter(); mountFadeIns();
}
main();