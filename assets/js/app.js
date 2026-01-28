export async function getJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error(`Fetch failed: ${url} (${r.status})`);
  return await r.json();
}
export function applyTheme(theme){
  const root = document.documentElement;
  const map = {
    "--bg": theme.bg, "--surface": theme.surface, "--border": theme.border,
    "--text": theme.text, "--muted": theme.muted, "--accent": theme.accent,
    "--accent2": theme.accent2, "--radius": (theme.radius ?? 18) + "px"
  };
  for(const k in map){ if(map[k]!=null) root.style.setProperty(k, map[k]); }
}
export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
export function mountFadeIns(){ qsa(".fade").forEach((el,i)=> setTimeout(()=> el.classList.add("in"), 60+i*25)); }
export function formatYear(){ return new Date().getFullYear(); }
export function escapeHTML(s=""){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
}
export async function mountNav(activeHref){
  const g = await getJSON("content/settings/global.json");
  const nav = qs("#nav"); if(!nav) return;
  nav.innerHTML = `
    <div class="nav">
      <div class="container nav-inner">
        <a class="brand" href="index.html" aria-label="Home">
          <span class="logo"></span>
          <span>${escapeHTML(g.siteName || "ModernStay")}</span>
        </a>
        <nav class="menu" aria-label="Main navigation">
          ${(g.nav||[]).map(i=> `<a href="${i.href}" ${i.href===activeHref? 'style="color: rgba(234,240,255,0.95)"':''}>${escapeHTML(i.label)}</a>`).join("")}
        </nav>
        <div class="nav-cta">
          <a class="btn ghost" href="availability.html">Availability</a>
          <a class="btn primary" href="${g.bookingUrl}" target="_blank" rel="noopener">${escapeHTML(g.ctaLabel||"BOOK NOW")}</a>
          <button class="btn mobile-toggle" id="mobileToggle" type="button">Menu</button>
        </div>
      </div>
      <div class="container" id="mobileMenu" style="display:none; padding-bottom:12px">
        <div class="card" style="padding:12px; border-radius:18px">
          ${(g.nav||[]).map(i=> `<a style="display:block; padding:10px 8px; font-weight:850; color: rgba(234,240,255,0.86)" href="${i.href}">${escapeHTML(i.label)}</a>`).join("")}
          <div class="hr"></div>
          <a class="btn primary" style="width:100%; justify-content:center" href="${g.bookingUrl}" target="_blank" rel="noopener">${escapeHTML(g.ctaLabel||"BOOK NOW")}</a>
        </div>
      </div>
    </div>`;
  const btn = qs("#mobileToggle"), mm = qs("#mobileMenu");
  if(btn && mm){
    const close = ()=> mm.style.display = "none";
    const toggle = ()=> mm.style.display = (mm.style.display==="none" ? "block" : "none");

    btn.addEventListener("click", (e)=>{ e.stopPropagation(); toggle(); });

    // Close when clicking any link in the mobile menu
    mm.addEventListener("click", (e)=>{
      const a = e.target.closest("a");
      if(a) close();
      e.stopPropagation();
    });

    // Close when tapping outside
    document.addEventListener("click", ()=> close());
    // Escape to close (desktop)
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") close(); });
  }
}
export async function mountFooter(){
  const g = await getJSON("content/settings/global.json");
  const foot = qs("#footer"); if(!foot) return;
  const f = g.footer || {}; const year = formatYear();
  foot.innerHTML = `
    <div class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="brand" style="margin-bottom:10px"><span class="logo"></span><span>${escapeHTML(f.col1Title || g.siteName || "ModernStay")}</span></div>
            <div class="small">${escapeHTML(f.col1Text || "")}</div>
          </div>
          <div>
            <div class="badge"><span class="dot"></span>${escapeHTML(f.col2Title || "Contact")}</div>
            <div style="margin-top:10px" class="small">
              <div>${escapeHTML(f.email || "")}</div>
              <div>${escapeHTML(f.phone || "")}</div>
              <div>${escapeHTML(f.address || "")}</div>
            </div>
          </div>
          <div>
            <div class="badge"><span class="dot"></span>${escapeHTML(f.col3Title || "Links")}</div>
            <div style="margin-top:10px" class="small">
              ${(f.links||[]).map(l=> `<div><a href="${l.href}">${escapeHTML(l.label)}</a></div>`).join("")}
            </div>
          </div>
        </div>
        <div class="hr"></div>
        <div class="copy">${escapeHTML((f.copyright || "© {year}").replace("{year}", String(year)))}</div>
      </div>
    </div>`;
}
export function toast(msg){
  let el = qs("#toast");
  if(!el){
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText="position:fixed; left:50%; bottom:20px; transform:translateX(-50%); z-index:9999; padding:10px 12px; border-radius:999px; font-weight:850; font-size:13px; background: rgba(7,10,16,0.72); border:1px solid rgba(234,240,255,0.14); color: rgba(234,240,255,0.92); backdrop-filter: blur(14px); opacity:0; transition: opacity .2s ease";
    document.body.appendChild(el);
  }
  el.textContent = msg; el.style.opacity="1";
  setTimeout(()=> el.style.opacity="0", 2200);
}