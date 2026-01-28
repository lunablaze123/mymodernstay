import { getJSON, escapeHTML, toast } from "../app.js";

function normalize(s=""){
  return s.toLowerCase()
    .replace(/[čć]/g,"c").replace(/š/g,"s").replace(/ž/g,"z")
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function tokens(s){
  const t = normalize(s).split(" ").filter(Boolean);
  return t.filter(x => x.length > 2);
}

function jaccard(a,b){
  const A = new Set(a), B = new Set(b);
  if(A.size===0 || B.size===0) return 0;
  let inter=0;
  for(const x of A) if(B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter/union : 0;
}

function bestMatch(userText, items){
  const uNorm = normalize(userText);
  const uTok = tokens(userText);
  let best = {score:0, item:null};

  for(const it of items){
    const qs = Array.isArray(it.q) ? it.q : [it.q];
    for(const q of qs){
      const qNorm = normalize(q);
      const qTok = tokens(q);
      let score = jaccard(uTok, qTok);

      if(qNorm && uNorm.includes(qNorm)) score = Math.max(score, 0.92);
      for(const kw of qTok){
        if(uTok.includes(kw)) score = Math.max(score, score + 0.08);
      }
      if(score > best.score){
        best = {score, item: it};
      }
    }
  }
  return best;
}

function applyPlaceholders(text, globals){
  const repl = {
    bookingUrl: globals.bookingUrl || "",
    tourEmbedUrl: globals.tourEmbedUrl || "",
    email: globals.footer?.email || globals.email || "info@mymodernstay.com",
    phone: globals.footer?.phone || globals.phone || "",
    address: globals.footer?.address || globals.address || ""
  };
  return String(text||"").replace(/\{(\w+)\}/g, (_,k)=> repl[k] ?? "");
}

function el(tag, attrs={}, html=""){
  const e = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==="class") e.className = v;
    else if(k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  if(html) e.innerHTML = html;
  return e;
}

function mountStyles(){
  const css = `
  .msbot-btn{position:fixed; right:16px; bottom:16px; z-index:99998; width:56px; height:56px; border-radius:18px;
    border:1px solid rgba(234,240,255,0.14); background: linear-gradient(135deg, rgba(124,92,255,0.95), rgba(0,209,255,0.85));
    box-shadow: 0 24px 70px rgba(0,0,0,0.45); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:950; }
  .msbot-panel{position:fixed; right:16px; bottom:84px; z-index:99998; width:min(380px, calc(100% - 32px));
    border-radius:20px; border:1px solid rgba(234,240,255,0.14); background: rgba(7,10,16,0.72); backdrop-filter: blur(14px);
    box-shadow: 0 24px 70px rgba(0,0,0,0.55); overflow:hidden; display:none;}
  .msbot-head{padding:12px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px; border-bottom:1px solid rgba(234,240,255,0.10);}
  .msbot-title{display:flex; align-items:center; gap:10px;}
  .msbot-dot{width:10px; height:10px; border-radius:999px; background: linear-gradient(135deg, rgba(124,92,255,0.95), rgba(0,209,255,0.85));}
  .msbot-name{font-weight:950; letter-spacing:0.02em;}
  .msbot-sub{color: rgba(234,240,255,0.62); font-size:12.5px; font-weight:800;}
  .msbot-x{cursor:pointer; border-radius:12px; border:1px solid rgba(234,240,255,0.12); background: rgba(255,255,255,0.04);
    color: rgba(234,240,255,0.85); padding:8px 10px; font-weight:900;}
  .msbot-body{padding:12px; max-height: 52vh; overflow:auto;}
  .msbot-msg{margin:10px 0; display:flex;}
  .msbot-msg.bot{justify-content:flex-start;}
  .msbot-msg.user{justify-content:flex-end;}
  .msbot-bubble{max-width: 88%; padding:10px 12px; border-radius:16px; border:1px solid rgba(234,240,255,0.12);
    background: rgba(255,255,255,0.04); color: rgba(234,240,255,0.92); line-height:1.5; font-size:13.5px; font-weight:700;}
  .msbot-msg.user .msbot-bubble{background: rgba(124,92,255,0.18); border-color: rgba(124,92,255,0.22);}
  .msbot-footer{padding:12px; border-top:1px solid rgba(234,240,255,0.10); display:grid; gap:10px;}
  .msbot-chips{display:flex; gap:8px; flex-wrap:wrap;}
  .msbot-chip{padding:7px 10px; border-radius:999px; border:1px solid rgba(234,240,255,0.12); background: rgba(255,255,255,0.03);
    color: rgba(234,240,255,0.80); font-weight:850; font-size:12px; cursor:pointer;}
  .msbot-row{display:flex; gap:10px;}
  .msbot-input{flex:1; padding:10px 12px; border-radius:14px; border:1px solid rgba(234,240,255,0.14); background: rgba(255,255,255,0.03);
    color: rgba(234,240,255,0.92); outline:none; font-weight:750;}
  .msbot-send{padding:10px 12px; border-radius:14px; border:1px solid rgba(234,240,255,0.14); background: rgba(255,255,255,0.04);
    color: rgba(234,240,255,0.92); font-weight:950; cursor:pointer;}
  .msbot-send:hover,.msbot-x:hover{transform: translateY(-1px);}
  `;
  const s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
}

function linkify(text){
  const urlRe = /(https?:\/\/[^\s]+)/g;
  return escapeHTML(text).replace(urlRe, (m)=> `<a href="${m}" target="_blank" rel="noopener" style="color: rgba(0,209,255,0.9); text-decoration: underline">${m}</a>`);
}

function appendMsg(body, who, text){
  const wrap = el("div", {class:`msbot-msg ${who}`});
  const bubble = el("div", {class:"msbot-bubble"}, linkify(text));
  wrap.appendChild(bubble);
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

async function main(){
  mountStyles();

  let globals = null, faq = null;
  try{
    globals = await getJSON("content/settings/global.json");
    faq = await getJSON("content/bot/faq.json");
  }catch(e){
    console.warn("Support bot failed to load content:", e);
    return;
  }

  const btn = el("button", {class:"msbot-btn", type:"button", "aria-label":"Support chat"}, "?");
  const panel = el("div", {class:"msbot-panel", role:"dialog", "aria-label":"Support chat"});
  const head = el("div", {class:"msbot-head"});
  const headLeft = el("div", {class:"msbot-title"});
  headLeft.appendChild(el("div", {class:"msbot-dot"}));
  headLeft.appendChild(el("div", {}, `<div class="msbot-name">${escapeHTML(faq.botName || "Support")}</div><div class="msbot-sub">Quick answers • no spam</div>`));
  const close = el("button", {class:"msbot-x", type:"button"}, "×");
  head.appendChild(headLeft);
  head.appendChild(close);

  const body = el("div", {class:"msbot-body"});
  const foot = el("div", {class:"msbot-footer"});
  const chips = el("div", {class:"msbot-chips"});
  (faq.quickReplies||[]).slice(0,6).forEach(c=>{
    const chip = el("button", {class:"msbot-chip", type:"button"}, escapeHTML(c));
    chip.addEventListener("click", ()=> send(c));
    chips.appendChild(chip);
  });
  const row = el("div", {class:"msbot-row"});
  const input = el("input", {class:"msbot-input", placeholder:"Ask a question (e.g. booking, check-in, parking, 3D tour)…", autocomplete:"off"});
  const sendBtn = el("button", {class:"msbot-send", type:"button"}, "Send");
  row.appendChild(input);
  row.appendChild(sendBtn);

  foot.appendChild(chips);
  foot.appendChild(row);

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(foot);

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  function open(){
    panel.style.display = "block";
    input.focus();
  }
  function hide(){
    panel.style.display = "none";
  }

  btn.addEventListener("click", ()=>{
    const isOpen = panel.style.display === "block";
    if(isOpen) hide(); else open();
  });
  close.addEventListener("click", hide);

  function answer(text){
    const m = bestMatch(text, faq.items || []);
    const threshold = 0.28;
    if(m.item && m.score >= threshold){
      return applyPlaceholders(m.item.a, globals);
    }
    return applyPlaceholders(faq.fallback, globals);
  }

  function send(text){
    const t = String(text||"").trim();
    if(!t) return;
    appendMsg(body, "user", t);
    const a = answer(t);
    setTimeout(()=> appendMsg(body, "bot", a), 120);
  }

  appendMsg(body, "bot", applyPlaceholders(faq.welcome, globals));

  sendBtn.addEventListener("click", ()=>{ send(input.value); input.value=""; });
  input.addEventListener("keydown", (e)=>{
    if(e.key==="Enter"){
      e.preventDefault();
      send(input.value); input.value="";
    }
  });

  setTimeout(()=> toast("Support bot ready ✅"), 600);
}

main();