async function loadContent() {
  const res = await fetch('assets/data/content.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load content.json');
  return await res.json();
}

function setMeta(name, content) {
  const el = document.querySelector(`meta[name="${name}"]`);
  if (el) el.setAttribute('content', content);
}

function setTitle(t) { document.title = t; }

function bindText(selector, text) {
  const el = document.querySelector(selector);
  if (el && typeof text === 'string') el.textContent = text;
}

function bindHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el && typeof html === 'string') el.innerHTML = html;
}

function bindAttr(selector, attr, val) {
  const el = document.querySelector(selector);
  if (el && val != null) el.setAttribute(attr, val);
}

function formatWhatsAppLink(phone, message) {
  const digits = (phone || '').replace(/[^\d+]/g, '');
  const msg = encodeURIComponent(message || '');
  // wa.me doesn't accept '+' in path, so strip it.
  const path = digits.replace('+','');
  return `https://wa.me/${path}?text=${msg}`;
}

function showToast(text, ms=2400) {
  const t = document.querySelector('#toast');
  if (!t) return;
  t.textContent = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

window.MMS = { loadContent, bindText, bindHTML, bindAttr, formatWhatsAppLink, setMeta, setTitle, showToast };
