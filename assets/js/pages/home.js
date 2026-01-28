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

/* ---------------------------
   One-time fade-in (for lower sections only)
---------------------------- */
function mountFadeInsOnce() {
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
   Scroll Scene (SCRUB)
   - Hero content + nav slide/fade out
   - Video shade dims
   - Apartments appear one-by-one (stagger)
   - Reverses naturally when scrolling back up
---------------------------- */
function mountScrollScene() {
  const hero = qs("#hero");
  const heroContent = qs("#heroContent");
  const shade = qs("#heroShade");

  const apartments = qs("#apartments");
  const apHead = qs("#apHead");
  const grid = qs("#apartmentsGrid");

  if (!hero || !apartments || !grid) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // keep it simple for reduced motion users

  // Initial states for apartments (so they don't all show at once)
  const initApartmentStyles = () => {
    const cards = grid.querySelectorAll(".ap-card");
    if (apHead) {
      apHead.style.opacity = "0";
      apHead.style.transform = "translate3d(0, 14px, 0)";
    }
    cards.forEach((c) => {
      c.style.opacity = "0";
      c.style.transform = "translate3d(0, 22px, 0) scale(0.985)";
    });
  };

  // Make sure nav element exists (it’s injected by mountNav)
  let navEl = document.querySelector(".nav") || null;

  let ticking = false;

  const update = () => {
    const y = window.scrollY || 0;
    const vh = Math.max(1, window.innerHeight || 1);

    // Grab nav if it appears later
    if (!navEl) navEl = document.querySelector(".nav");

    // HERO exit progress: 0 at top, 1 near apartments
    const heroEnd = Math.max(1, apartments.offsetTop);
    const p = clamp01(y / (heroEnd * 0.85));
    const pe = smoothstep(p);

    // Hero content slides up + fades out
    if (heroContent) {
      const op = clamp01(1 - pe * 1.15);
      heroContent.style.opacity = String(op);
      heroContent.style.transform = `translate3d(0, ${-pe * 46}px, 0)`;
      heroContent.style.pointerEvents = (op < 0.15) ? "none" : "auto";
    }

    // Nav fades/slides out as you scroll down
    if (navEl) {
      const np = clamp01(y / (vh * 0.35));
      const ne = smoothstep(np);
      const op = clamp01(1 - ne * 0.95);
      navEl.style.opacity = String(op);
      navEl.style.transform = `translate3d(0, ${-ne * 18}px, 0)`;
      navEl.style.pointerEvents = (op < 0.2) ? "none" : "auto";
    }

    // Shade dims a bit as hero exits
    if (shade) {
      shade.style.opacity = String(0.65 + pe * 0.25);
    }

    // Apartments reveal window (scrubbed)
    // starts before apartments hits viewport, ends shortly after it reaches top
    const start = apartments.offsetTop - vh * 0.70;
    const end = apartments.offsetTop + vh * 0.12;
    const rp = clamp01((y - start) / Math.max(1, (end - start)));

    // Head appears first
    if (apHead) {
      const he = smoothstep(clamp01(rp / 0.45));
      apHead.style.opacity = String(he);
      apHead.style.transform = `translate3d(0, ${(1 - he) * 14}px, 0)`;
    }

    // Cards stagger one-by-one
    const cards = Array.from(grid.querySelectorAll(".ap-card"));
    const stagger = 0.14;  // time between cards
    const dur = 0.35;      // how long each card takes to appear

    cards.forEach((card, i) => {
      const t = clamp01((rp - i * stagger) / dur);
      const te = smoothstep(t);

      card.style.opacity = String(te);
      card.style.transform =
        `translate3d(0, ${(1 - te) * 22}px, 0) scale(${0.985 + te * 0.015})`;
    });

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  initApartmentStyles();
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
    // Keep dot + set label text after it
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
  mountFadeInsOnce();     // for lower sections (.fade)
  mountScrollScene();     // the scrubbed hero->apartments effect
  mountApartmentHighlight();

  await mountFooter();
}

main();
