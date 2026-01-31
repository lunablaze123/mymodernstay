(function(){
  const qs = (s) => document.querySelector(s);
  const CONFIG_URL = 'assets/data/faqbot.json';
  const BOT_VERSION = '2026.01.30-2';

  const DEFAULT_BOT = {
    name: 'Support',
    welcome: 'Hi! How can I help you?',
    fallback: 'Sorry, I am not sure about that. Please contact us for help.',
    quickReplies: []
  };

  const DEFAULT_ITEMS = [
    { q: ['check in', 'check-in'], a: 'Check-in is from 15:00.' },
    { q: ['check out', 'check-out'], a: 'Check-out is until 11:00.' },
    { q: ['pets', 'pet policy'], a: 'No, pets are not allowed.' },
    { q: ['smoking'], a: 'No smoking inside the apartment.' },
    { q: ['parking'], a: 'Yes, underground parking is available.' }
  ];

  const state = {
    bound: false,
    items: DEFAULT_ITEMS,
    botCfg: DEFAULT_BOT,
    vars: {},
    bindAttempts: 0
  };

  function normalize(s){
    return String(s ?? '')
      .toLowerCase()
      .replace(/\bcheckin\b/g, 'check in')
      .replace(/\bcheckout\b/g, 'check out')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scorePair(question, candidate){
    const q = normalize(question);
    const c = normalize(candidate);
    if (!q || !c) return 0;
    if (q === c) return 1;
    if (q.includes(c) || c.includes(q)) return 0.9;
    const a = q.split(' ').filter(Boolean);
    const b = c.split(' ').filter(Boolean);
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    let hit = 0;
    for (const w of a) if (setB.has(w)) hit++;
    return hit / Math.max(3, a.length);
  }

  function scoreItem(question, itemQ){
    if (Array.isArray(itemQ)){
      let best = 0;
      for (const q of itemQ){
        const s = scorePair(question, q);
        if (s > best) best = s;
      }
      return best;
    }
    if (itemQ == null) return 0;
    return scorePair(question, itemQ);
  }

  function bestMatch(question, items){
    let best = { s: 0, item: null };
    for (const it of items){
      if (!it) continue;
      const s = scoreItem(question, it.q);
      if (s > best.s) best = { s, item: it };
    }
    return best;
  }

  function applyVars(text){
    const raw = (text || '').replace(/\{(\w+)\}/g, (_, key) => state.vars[key] || '');
    return raw
      .replace(/\s+\u2022\s*\./g, '.') // cleanup "• ." -> "."
      .replace(/\s+\u2022\s*$/g, '')   // cleanup trailing "•"
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+\./g, '.')
      .trim();
  }

  function getPanel(){
    return qs('#botPanel') || qs('[data-bot-panel]') || qs('.bot');
  }

  function getBody(){
    const panel = getPanel();
    return panel?.querySelector('#botBody, [data-bot-body], .bot-body')
      || qs('#botBody')
      || qs('.bot-body');
  }

  function getFab(){
    return qs('#botFab') || qs('[data-bot-open]') || qs('.bot-fab');
  }

  function getInput(panel){
    const root = panel || getPanel();
    return root?.querySelector('#botInput, [data-bot-input], .bot-input input, .bot-input textarea, input[type="text"], input:not([type]), textarea')
      || qs('#botInput')
      || qs('.bot-input input, .bot-input textarea');
  }

  function getTitle(){
    const panel = getPanel();
    return panel?.querySelector('#botTitle, [data-bot-title], .bot-header strong')
      || qs('#botTitle')
      || qs('.bot-header strong');
  }

  function getClose(){
    const panel = getPanel();
    return panel?.querySelector('#botClose, [data-bot-close], .bot-header button')
      || qs('#botClose')
      || qs('.bot-header button');
  }

  function appendMsg(role, text){
    let wrap = getBody();
    if (!wrap){
      const panel = getPanel();
      if (!panel) return;
      wrap = document.createElement('div');
      wrap.id = 'botBody';
      wrap.className = 'bot-body';
      panel.appendChild(wrap);
    }
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    const safeText = String(text ?? '').trim() || (role === 'bot' ? 'Okay.' : '');
    div.textContent = safeText;
    if (role === 'bot'){
      div.style.background = 'rgba(255,255,255,.14)';
      div.style.borderColor = 'rgba(255,255,255,.26)';
      div.style.color = '#f4f1ec';
    }
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function showInlineAnswer(answer){
    const panel = getPanel();
    if (!panel) return;
    let box = panel.querySelector('#botAnswer');
    if (!box){
      box = document.createElement('div');
      box.id = 'botAnswer';
      box.style.margin = '8px 0 6px';
      box.style.padding = '8px 10px';
      box.style.borderRadius = '12px';
      box.style.background = 'rgba(255,255,255,.10)';
      box.style.border = '1px solid rgba(255,255,255,.18)';
      box.style.fontSize = '12px';
      box.style.color = '#f4f1ec';
      const inputWrap = panel.querySelector('.bot-input') || panel;
      inputWrap.parentNode.insertBefore(box, inputWrap);
    }
    box.textContent = String(answer ?? '').trim();
  }

  function renderQuickReplies(list){
    if (!list || !list.length) return;
    const wrap = getBody();
    if (!wrap) return;
    if (wrap.querySelector('.bot-quick')) return;

    const holder = document.createElement('div');
    holder.className = 'bot-quick';
    holder.style.display = 'flex';
    holder.style.flexWrap = 'wrap';
    holder.style.gap = '6px';

    list.forEach((label) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'badge';
      btn.textContent = label;
      btn.addEventListener('click', () => handleQuery(label));
      holder.appendChild(btn);
    });

    wrap.appendChild(holder);
  }

  function handleQuery(text){
    const q = (text || '').trim();
    if (!q) return;
    appendMsg('user', q);

    let answer = '';
    try {
      const items = Array.isArray(state.items) ? state.items : [];
      const match = bestMatch(q, items);

      if (match.item && match.s >= 0.3){
        answer = applyVars(match.item.a);
      }

      // Hard fallback rules to always answer basics
      if (!answer){
        const nq = normalize(q);
        const has = (w) => nq.includes(w);

        if (has('check in') || has('checkin') || has('arrival')){
          answer = `Check-in is from ${state.vars.checkinTime || '15:00'}.`;
        } else if (has('check out') || has('checkout') || has('departure')){
          answer = `Check-out is until ${state.vars.checkoutTime || '11:00'}.`;
        } else if (has('pet') || has('pets')){
          answer = 'No, pets are not allowed.';
        } else if (has('smok') || has('cigarette')){
          answer = 'No smoking inside the apartment.';
        } else if (has('parking') || has('park')){
          answer = 'Yes, underground parking is available.';
        } else if (has('price') || has('prices') || has('rate') || has('how much')){
          answer = applyVars('Prices and availability are best confirmed in the booking system: {bookingUrl}.');
        } else if (has('book') || has('booking') || has('reserve') || has('reservation')){
          answer = applyVars('You can book via our secure booking page here: {bookingUrl}.');
        }
      }
    } catch {
      answer = '';
    }

    if (!answer){
      answer = applyVars(state.botCfg.fallback || DEFAULT_BOT.fallback) || 'Sorry, I did not understand.';
    }

    appendMsg('bot', answer);
    showInlineAnswer(answer);
  }

  function bindOnce(){
    if (state.bound) return;

    const panel = getPanel();
    if (!panel){
      if (state.bindAttempts < 20){
        state.bindAttempts += 1;
        setTimeout(bindOnce, 250);
      }
      return;
    }

    const fab = getFab();
    const close = getClose();

    const open = () => { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); };
    const shut = () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); };

    fab?.addEventListener('click', () => panel.classList.contains('open') ? shut() : open());
    close?.addEventListener('click', shut);

    panel.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;
      const sendTrigger = target.closest?.(
        '.bot-input #botSend, .bot-input [data-bot-send], .bot-input .send, .bot-input button, .bot-input a, .bot-input [role="button"]'
      );
      if (!sendTrigger) return;
      const input = getInput(panel);
      const q = (input?.value || '').trim();
      if (!q) return;
      if (input) input.value = '';
      handleQuery(q);
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const target = e.target;
      if (!target?.matches?.('input, textarea')) return;
      e.preventDefault();
      const q = (target.value || '').trim();
      if (!q) return;
      target.value = '';
      handleQuery(q);
    });

    state.bound = true;
  }

  function extractTime(content, label){
    const items = content?.rules?.items || [];
    const hit = items.find((it) => (it.label || '').toLowerCase().includes(label));
    const val = hit?.value || '';
    const m = val.match(/\b\d{1,2}:\d{2}\b/);
    return m ? m[0] : val;
  }

  function extractVars(content){
    const email = content?.contact?.support_email || '';
    const phone = content?.contact?.phone || content?.contact?.whatsapp || '';
    const bookingUrl = content?.booking?.beds24_base_url || '';
    const address = content?.contact?.address || content?.site?.address || '';
    const tourEmbedUrl = content?.integrations?.tour_embed_url || content?.site?.tour_url || '';
    const checkinTime = extractTime(content, 'check-in');
    const checkoutTime = extractTime(content, 'check-out');
    return { email, phone, bookingUrl, address, tourEmbedUrl, checkinTime, checkoutTime };
  }

  function mapItems(items){
    if (!Array.isArray(items)) return [];
    const out = [];
    for (const it of items){
      if (!it) continue;
      const rawQ = Array.isArray(it.q) ? it.q : [it.q];
      const q = rawQ.map((v) => String(v ?? '').trim()).filter(Boolean);
      const a = String(it.a ?? '').trim();
      if (!q.length || !a) continue;
      out.push({ q, a });
    }
    return out;
  }

  async function loadConfig(){
    try {
      const res = await fetch(CONFIG_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== 'object') return null;
      return data;
    } catch {
      return null;
    }
  }

  async function loadConfigWithTimeout(ms){
    return await Promise.race([
      loadConfig(),
      new Promise((resolve) => setTimeout(() => resolve(null), ms))
    ]);
  }

  async function initBot(content){
    const enabled = content?.faq?.bot?.enabled !== false;
    if (!enabled){
      const fab = getFab();
      const panel = getPanel();
      if (fab) fab.style.display = 'none';
      if (panel) panel.style.display = 'none';
      return;
    }

    // Bind immediately with safe defaults so the bot responds even if config loading stalls.
    state.vars = extractVars(content);

    const contentItems = Array.isArray(content?.faq?.items) ? mapItems(content.faq.items) : [];
    const items = contentItems.length ? contentItems : DEFAULT_ITEMS;

    state.botCfg = {
      name: content?.faq?.bot?.name || DEFAULT_BOT.name,
      welcome: content?.faq?.bot?.intro || DEFAULT_BOT.welcome,
      fallback: content?.faq?.bot?.fallback || DEFAULT_BOT.fallback,
      quickReplies: DEFAULT_BOT.quickReplies
    };
    state.items = items;

    bindOnce();

    const title = getTitle();
    if (title){
      title.textContent = state.botCfg.name;
      const header = title.closest('.bot-header') || title.parentElement;
      if (header && !header.querySelector('.bot-version')){
        const v = document.createElement('span');
        v.className = 'kbd bot-version';
        v.textContent = BOT_VERSION;
        v.style.marginLeft = '8px';
        v.style.opacity = '0.7';
        header.appendChild(v);
      }
    }

    const body = getBody();
    if (body && body.children.length === 0){
      appendMsg('bot', applyVars(state.botCfg.welcome));
      renderQuickReplies(state.botCfg.quickReplies);
    }

    // Attempt to load external config; update state if it arrives quickly.
    const cfg = await loadConfigWithTimeout(1500);
    if (!cfg) return;

    const cfgItems = Array.isArray(cfg?.items) ? mapItems(cfg.items) : [];
    if (cfgItems.length) state.items = cfgItems;

    state.botCfg = {
      name: cfg?.botName || state.botCfg.name,
      welcome: cfg?.welcome || state.botCfg.welcome,
      fallback: cfg?.fallback || state.botCfg.fallback,
      quickReplies: Array.isArray(cfg?.quickReplies) ? cfg.quickReplies : state.botCfg.quickReplies
    };

    if (title) title.textContent = state.botCfg.name;

    if (body){
      const existingQuick = body.querySelector('.bot-quick');
      if (existingQuick) existingQuick.remove();
      renderQuickReplies(state.botCfg.quickReplies);
    }
  }

  function autoInit(){
    const fallbackContent = { faq: { bot: DEFAULT_BOT }, contact: {}, booking: {} };
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', () => initBot(fallbackContent));
    } else {
      initBot(fallbackContent);
    }
  }

  autoInit();
  window.MMS_initFAQBot = initBot;
})();
