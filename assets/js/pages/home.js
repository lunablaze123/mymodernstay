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
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

function typeText(el, text, speed = 45) {
  if (!el) return;
  el.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i++] ?? "";
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

/* Lower sections fade-in once */
function mountFadeInsOnce() {
  const els = document.querySelectorAll(".fade");
  if (!els.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { els.forEach(el => el.classList.add("in")); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

/* Scroll progress bar */
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
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  update();
}

/* Auto-highlight apartments */
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

function mountLazyImages() {
  document.querySelectorAll("img").forEach(img => img.loading = "lazy");
}

/* ---------------------------
   Scroll Scene:
   - hero text moves up + fades
   - nav moves up + fades
   - hero VIDEO/background moves up + slightly fades/dims (so it doesn't "stick")
   - apartments reveal later, one-by-one
   - reverse automatically on scroll up
---------------------------- */
function mountScrollScene() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const hero = qs("#hero");
  const heroContent = qs("#heroContent");
  const heroBg = qs("#heroBg");
  const shade = qs("#heroShade");

  const apartments = qs("#apartments");
  const apHead = qs("#apHead");
  const grid = qs("#apartmentsGrid");

  if (!hero || !apartments || !grid) return;

  // Nav element (mountNav injects)
  let navEl = document.querySelector(".nav");
  if (!navEl) {
    const navMount = document.querySelector("#nav");
    navEl = navMount ? navMount.firstElementChild : null;
  }

  // init apartments hidden (so they appear one-by-one)
  function initApartments() {
    if (apHead) {
      apHead.style.opacity = "0";
      apHead.style.transform = "translate3d(0, 16px, 0)";
    }
    grid.querySelectorAll(".ap-card").forEach(card => {
      card.style.opacity = "0";
      card.style.transform = "translate3d(0, 28px, 0) scale(0.985)";
    });
  }

  let ticking = false;

  function update() {
    const y = window.scrollY || 0;
    const vh = Math.max(1, window.innerHeight || 1);
    const apTop = apartments.offsetTop || vh;

    // HERO progress based on hero height (feels natural)
    // 0 at top, 1 when you reach the end of hero (near apartments)
    const heroP = clamp01(y / (vh * 0.95));
    const heroE = smoothstep(heroP);

    // 1) Hero text (scrubbed)
    if (heroContent) {
      const op = clamp01(1 - heroE * 1.1);
      heroContent.style.opacity = String(op);
      heroContent.style.transform = `translate3d(0, ${-heroE * 60}px, 0)`;
      heroContent.style.pointerEvents = op < 0.15 ? "none" : "auto";
    }

    // 2) Nav fades/slides up early
    if (navEl) {
      const navP = clamp01(y / (vh * 0.45));
      const navE = smoothstep(navP);
      const op = clamp01(1 - navE * 1.05);
      navEl.style.opacity = String(op);
      navEl.style.transform = `translate3d(0, ${-navE * 20}px, 0)`;
      navEl.style.pointerEvents = op < 0.2 ? "none" : "auto";
    }

    // 3) HERO BACKGROUND (THIS IS THE FIX YOU ASKED FOR)
    // Make the video move up too, and fade/dim a bit, so it doesn't feel "stuck".
    if (heroBg) {
      // Move up more than the text (gives a "leaving" feel)
      const move = -heroE * (vh * 0.35);
      // Fade a little near the end
      const bgFade = smoothstep(clamp01((heroP - 0.55) / 0.45)); // starts later
      const opacity = 1 - bgFade * 0.35; // don't fully disappear, just soften
      heroBg.style.transform = `translate3d(0, ${move}px, 0)`;
      heroBg.style.opacity = String(opacity);
      // small brightness drop at end for a cinematic transition
      heroBg.style.filter = `brightness(${1 - bgFade * 0.15})`;
    }

    // Shade also darkens slightly
    if (shade) {
      shade.style.opacity = String(0.62 + heroE * 0.28);
    }

    // 4) Apartments reveal LATER (so it’s not “on the video”)
    // start when apartments are basically coming into view
    const start = apTop - vh * 0.10;
    const end = apTop + vh * 0.55;
    const rp = clamp01((y - start) / Math.max(1, (end - start)));

    // heading first
    if (apHead) {
      const headT = smoothstep(clamp01(rp / 0.25));
      apHead.style.opacity = String(headT);
      apHead.style.transform = `translate3d(0, ${(1 - headT) * 16}px, 0)`;
    }

    // cards stagger one-by-one
    const cards = Array.from(grid.querySelectorAll(".ap-card"));
    const stagger = 0.18;
    const dur = 0.40;

    cards.forEach((card, i) => {
      const t = clamp01((rp - i * stagger) / dur);
      const e = smoothstep(t);
      card.style.opacity = String(e);
      card.style.transform =
        `translate3d(0, ${(1 - e) * 28}px, 0) scale(${0.985 + e * 0.015})`;
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  initApartments();
  update();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
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

  if (kicker) {
    const label = page.hero?.kicker || "Luxury Apartments";
    kicker.innerHTML = `<span class="dot"></span>${escapeHTML(label)}`;
  }
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
    <a class="card ap-card" href="apartment.html?id=${encodeURIComponent(ap.id)}">
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
  mountFadeInsOnce();
  mountScrollScene();
  mountApartmentHighlight();

  await mountFooter();
}

main();
