import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML, toast } from "../app.js";

async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");

  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");
  const aps = await Promise.all((idx.list||[]).map(id=> getJSON(`content/apartments/${id}.json`)));

  // Hero text
  qs("#kicker").textContent = page.hero?.kicker || "";
  qs("#heroTitle").textContent = page.hero?.title || "";
  qs("#heroSub").textContent = page.hero?.subtitle || "";

  // Hero media (background video + poster fallback)
  const v = qs("#heroVideo");
  const img = qs("#heroPoster");
  const videoUrl = page.hero?.video || "";
  const posterUrl = page.hero?.poster || "assets/media/images/hero.jpg";

  if(img) img.src = posterUrl;

  if(v){
    if(videoUrl){
      v.src = videoUrl;
      v.addEventListener("loadeddata", ()=>{ if(img) img.style.opacity = "0"; });
      v.addEventListener("error", ()=>{ if(img) img.style.opacity = "1"; });
      // try to play (some browsers may still block, but muted+playsinline should work)
      v.play().catch(()=>{ /* ignore */ });
    }else{
      v.removeAttribute("src");
      try{ v.load(); }catch(e){}
    }
  }

  // Hero CTAs
  const bookBtn = qs("#heroBookBtn");
  if(bookBtn){
    bookBtn.href = g.bookingUrl || "#";
    bookBtn.addEventListener("click", ()=> toast("Opening booking…"));
  }
  const tourBtn = qs("#heroTourBtn");
  if(tourBtn){
    tourBtn.href = g.tourEmbedUrl || "#";
    tourBtn.addEventListener("click", ()=> toast("Opening 3D tour…"));
  }

  // Apartments section
  qs("#apTitle").textContent = page.sections?.apartmentsTitle || "Choose your apartment";
  qs("#apSub").textContent = page.sections?.apartmentsSubtitle || "";
  qs("#apartmentsGrid").innerHTML = aps.map(ap=>`
    <a class="card ap-card fade" href="apartment.html?id=${encodeURIComponent(ap.id)}">
      <div class="img"><img src="${ap.gallery?.[0] || "assets/media/images/01.jpg"}" alt="${escapeHTML(ap.name||"Apartment")}"></div>
      <div class="body">
        <div class="badge"><span class="dot"></span>${escapeHTML(ap.size||"")}${ap.maxGuests? " • "+escapeHTML(String(ap.maxGuests))+" guests":""}</div>
        <div class="name">${escapeHTML(ap.name||"")}</div>
        <p class="teaser">${escapeHTML(ap.teaser||"")}</p>
        <div class="pills">${(ap.highlights||[]).slice(0,4).map(x=> `<span class="pill">${escapeHTML(x)}</span>`).join("")}</div>
      </div>
    </a>`).join("");

  // 3D tour + residence preview (kept below)
  qs("#tourTitle").textContent = page.sections?.tourTitle || "3D Tour";
  qs("#tourSub").textContent = page.sections?.tourSubtitle || "";
  qs("#tourFrame").src = g.tourEmbedUrl || "";
  qs("#resTitle").textContent = page.sections?.residenceTitle || "The Residence";
  qs("#resSub").textContent = page.sections?.residenceSubtitle || "";

  await mountFooter();
  mountFadeIns();
}

main();