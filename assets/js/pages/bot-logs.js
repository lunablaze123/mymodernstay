import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML, toast } from "../app.js";

const KEY = "MS_BOT_LOGS_V1";

function readLogs(){
  try{ return JSON.parse(localStorage.getItem(KEY) || "[]"); }catch(e){ return []; }
}

function saveLogs(arr){
  try{ localStorage.setItem(KEY, JSON.stringify(arr||[])); }catch(e){}
}

function download(filename, text){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type:"application/json"}));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(a.href), 400);
}

function render(){
  const logs = readLogs().slice().reverse();
  const tbody = qs("#logTable tbody");
  tbody.innerHTML = logs.map(x=>`
    <tr>
      <td class="small">${escapeHTML((x.ts||"").replace("T"," ").replace("Z",""))}</td>
      <td>${escapeHTML(x.q || "")}</td>
      <td>${x.matched ? "<span class='pill ok'>Yes</span>" : "<span class='pill bad'>No</span>"}</td>
      <td class="small">${escapeHTML(String(Math.round((x.score||0)*100)/100))}</td>
    </tr>
  `).join("");

  const total = logs.length;
  const answered = logs.filter(x=>x.matched).length;
  const unanswered = total - answered;
  qs("#stats").innerHTML = `Total: <strong>${total}</strong> • Answered: <strong>${answered}</strong> • Not answered: <strong>${unanswered}</strong>`;
}

async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("bot-logs.html");
  await mountFooter();
  mountFadeIns();

  qs("#refreshBtn").addEventListener("click", ()=>{ render(); toast("Refreshed"); });
  qs("#downloadBtn").addEventListener("click", ()=>{
    const logs = readLogs();
    download(`support-bot-logs-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(logs, null, 2));
    toast("Downloaded");
  });
  qs("#clearBtn").addEventListener("click", ()=>{
    if(confirm("Clear all local bot logs?")){
      saveLogs([]);
      render();
      toast("Cleared");
    }
  });

  render();
}

main();
