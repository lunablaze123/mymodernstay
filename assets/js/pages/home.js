import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML, toast } from "../app.js";

function stars(n=5){
  const full = "★".repeat(Math.max(0, Math.min(5, n)));
  const empty = "☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, n))));
  return full + empty;
}

function mountMiniCalendar(el){
  // Simple 2-row "mini" calendar (static) — designed as a visual cue only.
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear();
  const days = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const first = new Date(year, now.getMonth(), 1);
  const start = (first.getDay() + 6) % 7; // Monday=0
  const total = new Date(year, now.getMonth()+1, 0).getDate();

  let cells = [];
  for(let i=0;i<start;i++) cells.push("<div class='cal-cell dim'></div>");
  for(let d=1; d<=total; d++){
    const cls = (d===now.getDate()) ? "cal-cell today" : "cal-cell";
    cells.push(`<div class="${cls}">${d}</div>`);
  }
  el.innerHTML = `
    <div class="cal-head">
      <div class="cal-title">${month} ${year}</div>
      <div class="small" style="opacity:.85">Availability is shown in the booking page.</div>
    </div>
    <div class="cal-days">${days.map(x=>`<div class="cal-day">${x}</div>`).join("")}</div>
    <div class="cal-grid">${cells.join("")}</div>
  `;
}

async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");

  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");
  const aps = await Promise.all((idx.list||[]).map(id=> getJSON(`content/apartments/${id}.json`)));

  // Primary apartment for landing
  const primaryId = (g.primaryApartmentId || "apartma1");
  const ap = aps.find(x => x.id === primaryId) || aps[0];

  // Hero text (keep video)
  const kickerEl = qs("#kicker");
  if(kickerEl){
    kickerEl.textContent = page.hero?.kicker || "";
    kickerEl.style.display = kickerEl.textContent.trim() ? "" : "none";
  }
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
    bookBtn.textContent = "CHECK AVAILABILITY";
    bookBtn.addEventListener("click", ()=> toast("Opening booking…"));
  }
  const tourBtn = qs("#heroTourBtn");
  if(tourBtn){
    tourBtn.href = g.tourEmbedUrl || "#";
    tourBtn.textContent = "3D TOUR";
    tourBtn.addEventListener("click", ()=> toast("Opening 3D tour…"));
  }

  // Booking-style head
  qs("#listingTitle").textContent = ap.landingTitle || ap.name || "Apartment";
  qs("#listingSub").textContent = ap.landingSubtitle || ap.teaser || "";
  qs("#ratingLine").textContent = ap.ratingLine || "★★★★★ • Self check‑in • Fast Wi‑Fi";

  const bookingUrl = ap.bookingUrl || g.bookingUrl || "#";
  const bookingEmbedUrl = g.bookingEmbedUrl || "";
  const tourUrl = g.tourEmbedUrl || ap.tourEmbedUrl || "#";
  qs("#checkAvailTop").href = bookingUrl;
  qs("#seeDatesBtn").href = bookingUrl;
  qs("#requestToBookBtn").href = bookingUrl;

  // Comforts
  const facts = ap.facts || {};
  const comforts = [
    {label: facts.sleeps || `${ap.maxGuests || 4} guests`, icon: "👤"},
    {label: facts.bedrooms || "2 bedrooms", icon: "🛏️"},
    {label: facts.bathrooms || "1.5 bathrooms", icon: "🚿"},
    {label: facts.wifi || "High‑speed Wi‑Fi", icon: "📶"},
  ];
  qs("#comfortGrid").innerHTML = comforts.map(x=>`
    <div class="comfort">
      <div class="comfort-ic">${x.icon}</div>
      <div class="comfort-t">${escapeHTML(x.label)}</div>
    </div>
  `).join("");
  // Home gallery: use first 6 images
  const gallery = (ap.gallery || []).slice(0, 6);
  qs("#homeGallery").innerHTML = gallery.map(src=>`
    <a href="gallery.html" class="gimg">
      <img class="fade" src="${src}" alt="Gallery">
    </a>
  `).join("") || `<div class="small">Add images to <code>assets/media/images/01.jpg</code> …</div>`;

  // 3D embed
  const tourEmbed = g.tourEmbedUrl || "";
  const openTourBtn = qs("#openTourBtn");
  if(openTourBtn){ openTourBtn.href = tourEmbed || "#"; }
  qs("#homeTour").innerHTML = tourEmbed
    ? `<iframe class="iframe" src="${tourEmbed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`
    : `<div class="small">Add the embed link in <code>content/settings/global.json</code> → <code>tourEmbedUrl</code></div>`;

  // Why love list
  const why = (ap.whyLove || []);
  qs("#whyLove").innerHTML = why.map(x=> `<li>${escapeHTML(x)}</li>`).join("");
  // Beds24 availability embed (iframe if embeddable, otherwise open in new tab)
  const availWrap = qs("#availabilityEmbed");
  const bedsFrame = qs("#beds24Frame");
  const candidate = (bookingEmbedUrl || bookingUrl || "").trim();
  const isEmbeddable = /booking2\.php\?propid=|booking\.php\?propid=|booking3\.php\?propid=/i.test(candidate);
  if(bedsFrame){
    if(isEmbeddable){
      bedsFrame.src = candidate;
    }else if(availWrap){
      bedsFrame.remove();
      availWrap.innerHTML = `
        <div class="small" style="margin-bottom:10px">Availability opens on Beds24 for the best experience.</div>
        <a class="btn primary" href="${bookingUrl}" target="_blank" rel="noopener">Check availability</a>
      `;
    }
  }


  // Map embed
  const mapUrl = ap.neighborhood?.mapEmbedUrl || "";
  const mapEl = qs("#mapEmbed");
  if(mapUrl){
    mapEl.innerHTML = `<iframe src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  }else{
    mapEl.innerHTML = `<div class="small" style="opacity:.85">${escapeHTML(ap.neighborhood?.note || "Add a map embed URL.")}</div>`;
  }

  // Mini calendar + testimonial
  const mini = qs("#miniCal");
  if(mini){ mountMiniCalendar(mini); }
  const t = ap.testimonial || {};
  qs("#testimonial").innerHTML = `
    <div class="quote">“${escapeHTML(t.quote || "Add a guest quote in apartma1.json") }”</div>
    <div class="small" style="margin-top:10px">— ${escapeHTML(t.author || "Guest review")}</div>
    <div class="stars" aria-label="Rating" style="margin-top:10px">${escapeHTML(stars(Number(t.stars||5)))}</div>
  `;

  await mountFooter(); mountFadeIns();
}

main();