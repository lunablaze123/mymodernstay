import {
  getJSON,
  applyTheme,
  mountNav,
  mountFooter,
  qs,
  escapeHTML,
  toast
} from "../app.js";

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

/* ✅ Pinned Stage Scroll Scene */
function mountPinnedStageScene() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const stage = qs("#heroStage");
  const heroContent = qs("#heroContent");
  const shade = qs("#heroShade");
  const grid = qs("#apartmentsGrid");
  const apHead = qs("#apHead");

  if (!stage || !heroContent || !grid) return;

  // nav injected by mountNav
  let navEl = document.querySelector(".nav");
  if (!navEl) {
    const navMount = document.querySelector("#nav");
    navEl = navMount ? navMount.firstElementChild : null;
  }

  // hide apartments initially
  function init() {
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
    const rect = stage.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);

    // progress through stage: 0 at top, 1 at bottom
    const total = stage.offsetHeight - vh;
    const scrolled = clamp01((-rect.top) / Math.max(1, total));
    const p = smoothstep(scrolled);

    // Phase split:
    // 0 -> 0.45 : hero text fades/slides out
    // 0.45 -> 1 : apartments appear on video
    const phase1End = 0.45;

    // HERO TEXT OUT
    const heroT = clamp01(p / phase1End);
    const heroE = smoothstep(heroT);

    heroContent.style.opacity = String(1 - heroE);
    heroContent.style.transform = `translate3d(0, ${-heroE * 60}px, 0)`;
    heroContent.style.pointerEvents = heroE > 0.85 ? "none" : "auto";

    // NAV fades a bit too (optional)
    if (navEl) {
      const navE = smoothstep(clamp01(p / 0.30));
      const op = clamp01(1 - navE * 0.9);
      navEl.style.opacity = String(op);
      navEl.style.transform = `translate3d(0, ${-navE * 14}px, 0)`;
    }

    // SHADE dims slightly while transitioning
    if (shade) {
      shade.style.opacity = String(0.65 + heroE * 0.18);
    }

    // APARTMENTS IN (stagger)
    const revealP = clamp01((p - phase1End) / (1 - phase1End));
    const r = smoothstep(revealP);

    if (apHead) {
      const headE = smoothstep(clamp01(r / 0.25));
      apHead.style.opacity = String(headE);
      apHead.style.transform = `translate3d(0, ${(1 - headE) * 16}px, 0)`;
    }

    const cards = Array.from(grid.querySelectorAll(".ap-card"));
    const stagger = 0.18;
    const dur = 0.42;

    cards.forEach((card, i) => {
      const t = clamp01((r - i * stagger) / dur);
      const e = smoothstep(t);
      card.style.opacity = String(e);
      card.style.transform = `translate3d(0, ${(1 - e) * 28}px, 0) scale(${0.985 + e * 0.015})`;
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  init();
  update();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

async function main() {
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");

  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");

  const aps = await Promise.all((idx.list || []).map(id => getJSON(`content/apartments/${id}.json`)));

  // HERO
  const kicker = qs("#kicker");
  const title = qs("#heroTitle");
  const sub = qs("#heroSub");

  if (kicker) {
    const label = page.hero?.kicker || "Luxury Apartments";
    kicker.innerHTML = `<span class="dot"></span>${escapeHTML(label)}`;
  }
  if (title) typeText(title, page.hero?.title || "A modern stay, made simple.", 55);
  if (sub) { await sleep(450); sub.textContent = page.hero?.subtitle || "Three curated apartments. Clean design. Direct booking."; }

  // VIDEO
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

  // Apartments
  qs("#apTitle").textContent = page.sections?.apartmentsTitle || "Choose your apartment";
  qs("#apSub").textContent = page.sections?.apartmentsSubtitle || "Three options. Same standards.";

  qs("#apartmentsGrid").innerHTML = aps.map(ap => `
    <a class="card ap-card" href="apartment.html?id=${encodeURIComponent(ap.id)}">
      <div class="img">
        <img src="${ap.gallery?.[0] || "assets/media/images/01.jpg"}" alt="${escapeHTML(ap.name || "Apartment")}">
      </div>
      <div class="body">
        <div class="badge"><span class="dot"></span>${escapeHTML(ap.size || "")}${ap.maxGuests ? " • " + ap.maxGuests + " guests" : ""}</div>
        <div class="name">${escapeHTML(ap.name || "")}</div>
        <p class="teaser">${escapeHTML(ap.teaser || "")}</p>
        <div class="pills">
          ${(ap.highlights || []).slice(0,4).map(x => `<span class="pill">${escapeHTML(x)}</span>`).join("")}
        </div>
      </div>
    </a>
  `).join("");

  // Lower sections
  qs("#tourTitle").textContent = page.sections?.tourTitle || "3D Tour";
  qs("#tourSub").textContent = page.sections?.tourSubtitle || "Explore the residence instantly — no redirects.";
  qs("#tourFrame").src = g.tourEmbedUrl || "";

  qs("#resTitle").textContent = page.sections?.residenceTitle || "The Residence";
  qs("#resSub").textContent = page.sections?.residenceSubtitle || "Amenities, location and the bigger picture.";

  mountLazyImages();
  mountScrollProgress();
  mountPinnedStageScene();   // ✅ this is the pinned-video effect you asked for
  mountFadeInsOnce();
  mountApartmentHighlight();

  await mountFooter();
}

main();
