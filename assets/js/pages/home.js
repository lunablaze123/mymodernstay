import {
  getJSON,
  applyTheme,
  mountNav,
  mountFooter,
  mountFadeIns,
  qs,
  escapeHTML,
  toast
} from "../app.js";

/* ---------------------------
   Utility helpers
---------------------------- */
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function typeText(el, text, speed = 40) {
  if (!el) return;
  el.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

/* ---------------------------
   Scroll progress bar
---------------------------- */
function mountScrollProgress() {
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  bar.style.top = "0";
  bar.style.left = "0";
  bar.style.height = "3px";
  bar.style.background = "var(--accent, #fff)";
  bar.style.zIndex = "9999";
  bar.style.width = "0%";
  document.body.appendChild(bar);

  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = scrolled + "%";
  });
}

/* ---------------------------
   Hero parallax
---------------------------- */
function mountHeroParallax() {
  const hero = qs("#hero");
  if (!hero) return;

  window.addEventListener("scroll", () => {
    const y = window.scrollY * 0.4;
    hero.style.transform = `translateY(${y}px)`;
  });
}

/* ---------------------------
   Auto-highlight apartments
---------------------------- */
function mountApartmentHighlight() {
  const cards = document.querySelectorAll(".ap-card");
  if (!cards.length) return;

  let index = 0;
  setInterval(() => {
    cards.forEach(c => c.classList.remove("active"));
    cards[index].classList.add("active");
    index = (index + 1) % cards.length;
  }, 3500);
}

/* ---------------------------
   Lazy images
---------------------------- */
function mountLazyImages() {
  const imgs = document.querySelectorAll("img");
  imgs.forEach(img => img.loading = "lazy");
}

/* ---------------------------
   MAIN
---------------------------- */
async function main() {

  /* Theme + Nav */
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");

  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");
  const aps = await Promise.all(
    (idx.list || []).map(id =>
      getJSON(`content/apartments/${id}.json`)
    )
  );

  /* ---------------------------
     HERO
  ---------------------------- */
  const kicker = qs("#kicker");
  const title = qs("#heroTitle");
  const sub = qs("#heroSub");

  if (kicker) kicker.textContent = page.hero?.kicker || "";
  if (title) typeText(title, page.hero?.title || "", 55);
  if (sub) {
    await sleep(600);
    sub.textContent = page.hero?.subtitle || "";
  }

  /* Hero media */
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

  /* Hero buttons */
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

  /* ---------------------------
     APARTMENTS
  ---------------------------- */
  qs("#apTitle").textContent =
    page.sections?.apartmentsTitle || "Choose your apartment";
  qs("#apSub").textContent =
    page.sections?.apartmentsSubtitle || "";

  qs("#apartmentsGrid").innerHTML = aps.map(ap => `
    <a class="card ap-card fade"
       href="apartment.html?id=${encodeURIComponent(ap.id)}">
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
          ${(ap.highlights || []).slice(0,4)
            .map(x => `<span class="pill">${escapeHTML(x)}</span>`)
            .join("")}
        </div>
      </div>
    </a>
  `).join("");

  /* ---------------------------
     TOUR / RESIDENCE
  ---------------------------- */
  qs("#tourTitle").textContent =
    page.sections?.tourTitle || "3D Tour";
  qs("#tourSub").textContent =
    page.sections?.tourSubtitle || "";
  qs("#tourFrame").src = g.tourEmbedUrl || "";

  qs("#resTitle").textContent =
    page.sections?.residenceTitle || "The Residence";
  qs("#resSub").textContent =
    page.sections?.residenceSubtitle || "";

  /* ---------------------------
     GLOBAL EFFECTS
  ---------------------------- */
  mountScrollProgress();
  mountHeroParallax();
  mountApartmentHighlight();
  mountLazyImages();

  await mountFooter();
  mountFadeIns();
}

main();
