const QS = new URLSearchParams(location.search);
if(QS.get("edit")==="1"){
  const DRAFT_KEY="ms_wysiwyg_draft_v1";
  const state={edit:false, draft: loadJSON(localStorage.getItem(DRAFT_KEY))||{}, touched:new Set()};
  const binds = collect();
  mount(); mark(binds);

  function collect(){
    const page=document.body?.dataset?.page||"home";
    const map={
      home:[b("#kicker","content/pages/home.json","hero.kicker"),b("#heroTitle","content/pages/home.json","hero.title"),b("#heroSub","content/pages/home.json","hero.subtitle"),
            b("#apTitle","content/pages/home.json","sections.apartmentsTitle"),b("#apSub","content/pages/home.json","sections.apartmentsSubtitle"),
            b("#tourTitle","content/pages/home.json","sections.tourTitle"),b("#tourSub","content/pages/home.json","sections.tourSubtitle"),
            b("#resTitle","content/pages/home.json","sections.residenceTitle"),b("#resSub","content/pages/home.json","sections.residenceSubtitle")],
      apartment:[b("#title", apFile(), "name"), b("#sub", apFile(), "teaser"), b("#desc", apFile(), "description", {m:1})],
      residence:[b("#title","content/pages/residence.json","hero.title"),b("#sub","content/pages/residence.json","hero.subtitle")],
      availability:[b("#title","content/settings/booking.json","headline"),b("#sub","content/settings/booking.json","subline")],
      contact:[b("#title","content/pages/contact.json","hero.title"),b("#sub","content/pages/contact.json","hero.subtitle"),
              b("#name","content/pages/contact.json","contact.name"),b("#email","content/pages/contact.json","contact.email"),
              b("#phone","content/pages/contact.json","contact.phone"),b("#addr","content/pages/contact.json","contact.address")],
      policies:[], apartments:[]
    };
    return map[page]||[];
  }
  function b(sel,file,path,o={}){return {sel,file,path,...o};}
  function apFile(){ const id=new URLSearchParams(location.search).get("id")||"apartma1"; return `content/apartments/${id}.json`; }

  function mount(){
    const bar=document.createElement("div");
    bar.innerHTML=`<div style="position:fixed;left:14px;bottom:14px;z-index:99999;font-family:Inter,system-ui;background:rgba(7,10,16,.72);border:1px solid rgba(234,240,255,.14);backdrop-filter:blur(14px);border-radius:16px;padding:10px;box-shadow:0 24px 70px rgba(0,0,0,.45);display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <div style="font-weight:950;font-size:12px;color:rgba(234,240,255,.7);letter-spacing:.08em;text-transform:uppercase">Editor</div>
      <button id="msToggle" style="${btn()}">Edit mode: OFF</button>
      <button id="msSave" style="${btn()}">Save draft</button>
      <button id="msDownload" style="${btn(1)}">Download changes</button>
      <button id="msClose" style="${btn()}">Close</button>
    </div>`;
    document.body.appendChild(bar);
    byId("msToggle").onclick=()=>{state.edit=!state.edit; byId("msToggle").textContent="Edit mode: "+(state.edit?"ON":"OFF");};
    byId("msSave").onclick=()=>{localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft,null,2)); toast("Draft saved.");};
    byId("msDownload").onclick=download;
    byId("msClose").onclick=()=>{toast("Editor closed.");};
  }
  function btn(p=0){return `cursor:pointer;user-select:none;border-radius:999px;padding:8px 10px;font-weight:850;font-size:12.5px;border:1px solid rgba(234,240,255,.14);color:rgba(234,240,255,.9);background:${p?"linear-gradient(135deg, rgba(124,92,255,.95), rgba(0,209,255,.85))":"rgba(255,255,255,.04)"};`;}
  function byId(id){return document.getElementById(id);}

  function mark(list){
    const st=document.createElement("style");
    st.textContent=`.ms-editable{outline:1px dashed rgba(0,209,255,0);outline-offset:4px;border-radius:8px;transition:outline-color .12s ease}
    .ms-editable:hover{outline-color:rgba(0,209,255,.55)}.ms-editing{outline-color:rgba(124,92,255,.9)!important;background:rgba(255,255,255,.03)}`;
    document.head.appendChild(st);
    list.forEach(x=>{
      document.querySelectorAll(x.sel).forEach(el=>{
        el.dataset.f=x.file; el.dataset.p=x.path; el.dataset.m=x.m?"1":"0";
        el.classList.add("ms-editable");
        el.addEventListener("click",(e)=>{if(!state.edit) return; e.preventDefault(); e.stopPropagation(); edit(el);});
      });
    });
  }

  async function edit(el){
    const multiline=el.dataset.m==="1";
    el.classList.add("ms-editing"); el.contentEditable="true"; el.focus();
    const onKey=(e)=>{ if(e.key==="Escape") el.blur(); if(!multiline && e.key==="Enter"){e.preventDefault(); el.blur();} };
    const onBlur=async ()=>{
      el.classList.remove("ms-editing"); el.contentEditable="false";
      el.removeEventListener("keydown",onKey); el.removeEventListener("blur",onBlur);
      const text=(el.innerText||"").trim();
      const file=el.dataset.f, path=el.dataset.p;
      const obj=await load(file);
      setDeep(obj, path, text);
      state.draft[file]=obj; state.touched.add(file);
      toast("Updated.");
    };
    el.addEventListener("keydown",onKey); el.addEventListener("blur",onBlur);
  }

  async function load(file){
    if(state.draft[file]) return state.draft[file];
    const r=await fetch(file,{cache:"no-store"}); const j=await r.json(); state.draft[file]=j; return j;
  }
  function setDeep(obj, path, value){
    const parts=path.split(".").filter(Boolean); let cur=obj;
    for(let i=0;i<parts.length-1;i++){const k=parts[i]; if(typeof cur[k]!=="object"||cur[k]==null) cur[k]={}; cur=cur[k];}
    cur[parts[parts.length-1]]=value;
  }
  function download(){
    if(state.touched.size===0){toast("No changes yet."); return;}
    for(const file of state.touched){
      const name=file.split("/").pop();
      const blob=new Blob([JSON.stringify(state.draft[file],null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
    }
    toast("Downloaded JSON. Replace /content and push to GitHub.");
  }
  function toast(msg){
    let el=document.getElementById("toast");
    if(!el){
      el=document.createElement("div"); el.id="toast";
      el.style.cssText="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9999;padding:10px 12px;border-radius:999px;font-weight:850;font-size:13px;background:rgba(7,10,16,.72);border:1px solid rgba(234,240,255,.14);color:rgba(234,240,255,.92);backdrop-filter:blur(14px);opacity:0;transition:opacity .2s ease";
      document.body.appendChild(el);
    }
    el.textContent=msg; el.style.opacity="1"; setTimeout(()=>el.style.opacity="0", 2200);
  }
  function loadJSON(s){try{return JSON.parse(s);}catch(e){return null;}}
}