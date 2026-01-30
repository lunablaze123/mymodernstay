(function(){
  const qs = (s) => document.querySelector(s);

  function normalize(s){
    return (s||'')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function score(q, candidate){
    const a = normalize(q).split(' ').filter(Boolean);
    const b = normalize(candidate).split(' ').filter(Boolean);
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    let hit = 0;
    for (const w of a) if (setB.has(w)) hit++;
    return hit / Math.max(3, a.length);
  }

  function bestMatch(question, items){
    let best = {s:0, item:null};
    for (const it of items){
      const s = score(question, it.q);
      if (s > best.s){ best = {s, item:it}; }
    }
    return best;
  }

  function appendMsg(role, text){
    const wrap = qs('#botBody');
    if (!wrap) return;
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = text;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function submitUnanswered(question){
    // Netlify form submission (works if hosted on Netlify). Safe no-op elsewhere.
    const form = qs('#unansweredForm');
    if (!form) return;

    const data = new FormData(form);
    data.set('question', question);
    data.set('page', location.pathname);
    data.set('ts', new Date().toISOString());

    fetch('/', {
      method: 'POST',
      body: new URLSearchParams([...data.entries()]).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).catch(()=>{});
  }

  function initBot(content){
    const botCfg = content.faq?.bot || {};
    if (!botCfg.enabled) return;

    // Button toggles
    const fab = qs('#botFab');
    const panel = qs('#botPanel');
    const close = qs('#botClose');

    const open = () => { panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); };
    const shut = () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); };

    fab?.addEventListener('click', () => panel.classList.contains('open') ? shut() : open());
    close?.addEventListener('click', shut);

    // Header text
    qs('#botTitle').textContent = botCfg.name || 'Support';
    appendMsg('bot', botCfg.intro || 'Hi! How can I help?');

    // Send
    const items = content.faq?.items || [];
    const input = qs('#botInput');
    const sendBtn = qs('#botSend');

    function send(){
      const q = (input?.value || '').trim();
      if (!q) return;
      input.value = '';
      appendMsg('user', q);

      const match = bestMatch(q, items);
      if (match.item && match.s >= 0.34){
        appendMsg('bot', match.item.a);
      } else {
        appendMsg('bot', botCfg.fallback || 'I saved your question. Please contact us for help.');
        submitUnanswered(q);
        // Optional: prompt WhatsApp button toast
        if (window.MMS && content.contact?.whatsapp){
          MMS.showToast('Question saved. Use WhatsApp for fast help.');
        }
      }
    }

    sendBtn?.addEventListener('click', send);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }

  window.MMS_initFAQBot = initBot;
})();
