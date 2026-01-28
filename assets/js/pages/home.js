import {
  getJSON,
  applyTheme,
  mountNav,
  mountFooter,
  qs,
  escapeHTML,
  toast
} from "../app.js";

/* ---------------------------
   Helpers
---------------------------- */
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function typeText(el, text, speed = 45) {
  if (!el) return;
  el.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i++] ?? "";
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

/* ---------------------------
   Scroll reveal (fade-in on scroll)
---------------------------- */
function mountScrollReveal() {
  const els = document.querySelectorAll(".fade");
  if (!els.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    els.forEach(el => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

/* ---------------------------
   Scroll progress bar (smooth)
---------------------------- */
function mountScrollProgress() {
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  bar.style.top = "0";
  bar.style.left = "0";
  bar.style.height = "3px";
  bar.style.background = "var(--accent, #7C5CFF)";
  bar.style.zIndex = "9999";
  bar.style.width = "100%";
  bar.style.transformOrigin = "0 50%";
  bar.style.transform = "scaleX(0)";
  document.body.appendChild(bar);

  let ticking = false;

  function update() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop / max) : 0;
    bar.style.transform = `scaleX(${p})`;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}

/* ---------------------------
   Auto-highlight apartments (paused on hover)
---------------------------- */
function mountApartmentHighlight() {
  const cards = document.querySelectorAll(".ap-card");
  if (!cards.length) return;

  let index = 0;
  let paused = false;

  cards.forEach(c => {
    c.addEventListener("mouseenter", () => paused = true);
    c.addEventListener("mouseleave", () => paused = false);
  });

  setInterval(() => {
    if (paused) return;
    cards.forEach(c => c.classList.remove("active"));
    cards[index].classList.add("active");
    index = (index + 1) % cards.length;
  }, 3200);
}

/* ---------------------------
   Lazy images
---------------------------- */
function mountLazyImages() {
  document.querySelectorAll("img").forEach(img => img.loading = "lazy");
}

/* ---------------------------
   MAIN
---------------------------- */
async function main() {
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");

  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");

  const aps = await Promise.all(
    (idx.list || []).map(id => getJSON(`content/apartments/${id}.json`))
  );

  // HERO text
  const kicker = qs("#kicker");
  const title = qs("#heroTitle");
  const sub = qs("#heroSub");

  if (kicker) kicker.childNodes.length ? (kicker.lastChild.textContent = page.hero?.kicker || "Luxury Apartments") : (kicker.textContent = page.hero?.kicker || "Luxury Apartments");
  if (title) typeText(title, page.hero?.title || "A modern stay, made simple.", 55);
  if (sub) { await sleep(450); sub.textContent = page.hero?.subtitle || "Three curated apartments. Clean design. Direct booking."; }

  // HERO media
  const video = qs("#heroVideo");
  const poster = qs("#heroPoster");
  const videoUrl = page.hero?.video || "";
  const posterUrl = page.hero?.poster || "assets/media/images/hero.jpg";

  if (poster) poster.src = posterUrl;

  if (video && videoUrl) {
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadeddata", () => poster && (poster.style.opacity = "0"));
    video.addEventListener("error", () => poster && (poster.style.opacity = "1"));
    video.play().catch(() => {});
  }

  // Buttons
  const bookBtn = qs("#heroBookBtn");
  const tourBtn = qs("#heroTourBtn");

  if (bookBtn) {
    bookBtn.href = g.bookingUrl || "#";
    bookBtn.addEventListener("click", () => toast("Opening booking…"));
  }
  if (tourBtn) {
    tourBtn.href = g.tourEmbedUrl || "#";
    tourBtn.addEventListener("click", () => toast("Opening 3D tour…"));
  }

  // Apartments section
  qs("#apTitle").textContent = page.sections?.apartmentsTitle || "Choose your apartment";
  qs("#apSub").textContent = page.sections?.apartmentsSubtitle || "Three options. Same standards.";

  qs("#apartmentsGrid").innerHTML = aps.map(ap => `
    <a class="card ap-card fade" href="apartment.html?id=${encodeURIComponent(ap.id)}">
      <div class="img">
        <img src="${ap.gallery?.[0] || "assets/media/images/01.jpg"}"
             alt="${escapeHTML(ap.name || "Apartment")}">
      </div>
      <div class="body">
        <div class="badge">
          <span class="dot"></span>
          ${escapeHTML(ap.size || "")}
          ${ap.maxGuests ? " • " + ap.maxGuests + " guests" : ""}
        </div>
        <div class="name">${escapeHTML(ap.name || "")}</div>
        <p class="teaser">${escapeHTML(ap.teaser || "")}</p>
        <div class="pills">
          ${(ap.highlights || []).slice(0,4).map(x => `<span class="pill">${escapeHTML(x)}</span>`).join("")}
        </div>
      </div>
    </a>
  `).join("");

  // Tour/residence
  qs("#tourTitle").textContent = page.sections?.tourTitle || "3D Tour";
  qs("#tourSub").textContent = page.sections?.tourSubtitle || "Explore the residence instantly — no redirects.";
  qs("#tourFrame").src = g.tourEmbedUrl || "";

  qs("#resTitle").textContent = page.sections?.residenceTitle || "The Residence";
  qs("#resSub").textContent = page.sections?.residenceSubtitle || "Amenities, location and the bigger picture.";

  // Effects
  mountLazyImages();
  mountScrollProgress();
  mountScrollReveal();
  mountApartmentHighlight();

  await mountFooter();
}

main();
