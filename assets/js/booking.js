(function(){
  const qs = (s) => document.querySelector(s);

  function daysBetween(a, b) {
    const ms = b.getTime() - a.getTime();
    return Math.max(1, Math.round(ms / 86400000));
  }

  function parseDate(val) {
    if (!val) return null;
    const d = new Date(val + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function iso(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function buildBeds24Url(base, cssUrl, checkin, nights, adults, cacheBust=false){
    const u = new URL(base);

    // Beds24 parameters (best-effort; varies by booking setup)
    if (checkin) u.searchParams.set('checkin', checkin);
    if (nights)  u.searchParams.set('numnight', String(nights));
    if (adults)  u.searchParams.set('numadult', String(adults));

    // External CSS skin (must be HTTPS)
    if (cssUrl)  u.searchParams.set('cssfile', cssUrl);

    // Force english
    u.searchParams.set('lang', 'en');

    // Optional cache-bust for retries
    if (cacheBust) u.searchParams.set('_ts', String(Date.now()));
    return u.toString();
  }

  function openModal(){
    const m = qs('#bookingModal');
    if (!m) return;
    m.classList.add('open');
    document.body.style.overflow='hidden';
  }
  function closeModal(){
    const m = qs('#bookingModal');
    if (!m) return;
    m.classList.remove('open');
    document.body.style.overflow='';
  }

  function initBooking(content){
    const base = content.booking?.beds24_base_url || 'https://beds24.com/book-calypsophuket';
    const cssUrl = content.booking?.beds24_css_url || '';
    const adultsDefault = content.booking?.default_adults || 2;

    // 1) INLINE iframe inside the right card (always visible)
    const inline = qs('#inlineBeds24Frame');
    if (inline){
      const loader = qs('#inlineLoader');
      const retryBtn = qs('[data-inline-retry]');

      const setLoaderText = (title, sub) => {
        const txt = loader?.querySelector('.loader-text');
        const subEl = loader?.querySelector('.loader-sub');
        if (txt && title) txt.textContent = title;
        if (subEl && sub) subEl.textContent = sub;
      };

      let loaded = false;
      let stallTimer = null;

      // Hide loader when the iframe finishes loading
      inline.addEventListener('load', () => {
        loaded = true;
        if (stallTimer) clearTimeout(stallTimer);
        if (loader){
          loader.classList.add('hidden');
          loader.classList.remove('stalled');
        }
      }, { once: false });

      function startInlineLoad({ cacheBust=false } = {}){
        loaded = false;
        if (loader){
          loader.classList.remove('hidden');
          loader.classList.remove('stalled');
          setLoaderText('Loading secure booking…', 'This can take a few seconds on first load.');
        }

        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          if (loaded) return;
          if (loader){
            loader.classList.add('stalled');
            setLoaderText('Still loading…', 'Loading is taking longer than 10s. Open fullscreen or retry inline.');
          }
        }, 10000);

        inline.src = buildBeds24Url(base, cssUrl, null, null, adultsDefault, cacheBust);
      }

      retryBtn?.addEventListener('click', () => startInlineLoad({ cacheBust: true }));
      startInlineLoad();
    }

    // 2) Fullscreen modal (for bigger view)
    const openers = document.querySelectorAll('[data-open-booking]');
    openers.forEach(btn => btn.addEventListener('click', () => {
      // Optional: if date inputs exist on a page, use them; otherwise open without prefills.
      const inVal  = qs('#checkin')?.value || '';
      const outVal = qs('#checkout')?.value || '';
      const aVal   = Number(qs('#adults')?.value || adultsDefault);

      const din = parseDate(inVal);
      const dout = parseDate(outVal);

      let checkin = null, nights = null;
      if (din && dout && dout > din) {
        checkin = iso(din);
        nights = daysBetween(din, dout);
      } else if (din && !dout) {
        checkin = iso(din);
        nights = 1;
      }

      const iframe = qs('#beds24Frame');
      if (iframe){
        const sub = qs('#bookingSub');
        if (sub) sub.textContent = 'Loading secure booking…';
        iframe.addEventListener('load', () => {
          const s = qs('#bookingSub');
          if (s && s.textContent === 'Loading secure booking…') {
            s.textContent = 'Choose dates & quantity inside the secure booking window.';
          }
        }, { once: true });

        iframe.src = buildBeds24Url(base, cssUrl, checkin, nights, aVal);
      }

      const sub = qs('#bookingSub');
      if (sub) {
        sub.textContent = (checkin && nights)
          ? `Pre-selected: ${checkin} for ${nights} night(s), ${aVal} guest(s). (If not prefilled, choose dates inside.)`
          : `Choose dates & quantity inside the secure booking window.`;
      }

      openModal();
    }));

    qs('[data-close-booking]')?.addEventListener('click', closeModal);
    qs('#bookingModal')?.addEventListener('click', (e) => { if (e.target?.id === 'bookingModal') closeModal(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  window.MMS_initBooking = initBooking;
})();
