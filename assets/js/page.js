(async function(){
  const content = await MMS.loadContent();

  // Set accent
  if (content.site?.accent) document.documentElement.style.setProperty('--accent', content.site.accent);

  // SEO
  MMS.setTitle(content.site?.seo?.title || content.site?.name || 'MyModernStay');
  MMS.setMeta('description', content.site?.seo?.description || '');
  MMS.setMeta('keywords', content.site?.seo?.keywords || '');

  // Header / brand
  document.querySelectorAll('[data-site-name]').forEach(el => el.textContent = content.site?.name || 'MyModernStay');

  // Hero
  MMS.bindText('[data-hero-headline]', content.hero?.headline || '');
  MMS.bindText('[data-hero-subheadline]', content.hero?.subheadline || '');
  MMS.bindAttr('#heroVideo', 'src', content.hero?.video_src || '');

  // Highlights cards
  const hl = content.highlights || [];
  const hlWrap = document.querySelector('#highlights');
  if (hlWrap){
    hlWrap.innerHTML = hl.map(x => `
      <div class="card">
        <h4>${x.title}</h4>
        <p>${x.text}</p>
      </div>
    `).join('');
  }

  // Direct benefits
  const db = content.direct_benefits || [];
  const dbWrap = document.querySelector('#directBenefits');
  if (dbWrap){
    dbWrap.innerHTML = db.map(x => `<div class="fact"><span>•</span><strong>${x}</strong></div>`).join('');
  }

  // Apartment facts
  const facts = content.apartment?.facts || [];
  const factsWrap = document.querySelector('#apartmentFacts');
  if (factsWrap){
    factsWrap.innerHTML = facts.map(x => `<div class="fact"><span>${x.k}</span><strong>${x.v}</strong></div>`).join('');
  }

  // Apartment about
  const about = content.apartment?.about || [];
  const aboutWrap = document.querySelector('#apartmentAbout');
  if (aboutWrap){
    aboutWrap.innerHTML = about.map(p => `<p style="margin:0 0 12px;color:var(--muted)">${p}</p>`).join('');
  }

  // Gallery
  const g = content.gallery?.images || [];
  const gWrap = document.querySelector('#galleryGrid');
  if (gWrap){
    gWrap.innerHTML = g.map(i => `<div class="gimg"><img src="${i.src}" alt="${i.alt}"></div>`).join('');
  }

  // Rules page list
  const rulesWrap = document.querySelector('#rulesList');
  if (rulesWrap && content.rules?.items){
    rulesWrap.innerHTML = content.rules.items.map(r => `
      <div class="fact"><span>${r.label}</span><strong>${r.value}</strong></div>
    `).join('');
  }

  // FAQ page list
  const faqWrap = document.querySelector('#faqList');
  if (faqWrap && content.faq?.items){
    faqWrap.innerHTML = content.faq.items.map(x => `
      <div class="card">
        <h4 style="margin:0 0 6px">${x.q}</h4>
        <p style="margin:0;color:var(--muted)">${x.a}</p>
      </div>
    `).join('');
  }

  // Contact links (footer + bot fallback)
  const email = content.contact?.support_email || '';
  const wa = content.contact?.whatsapp || '';
  const waMsg = content.contact?.whatsapp_prefill || '';
  const waLink = (wa ? MMS.formatWhatsAppLink(wa, waMsg) : '#');

  document.querySelectorAll('[data-wa-link]').forEach(a => a.setAttribute('href', waLink));
  document.querySelectorAll('[data-email]').forEach(a => a.textContent = email);

  // Booking modal + bot + tawk
  if (window.MMS_initBooking) window.MMS_initBooking(content);
  if (window.MMS_initFAQBot) window.MMS_initFAQBot(content);

  // tawk integration (free live chat). Note: AI automation is a separate add-on in tawk.
  const tawk = content.integrations?.tawk;
  if (tawk?.enabled && window.MMS_injectTawk){
    window.MMS_injectTawk(tawk.property_id, tawk.widget_id);
  }

  // Optional analytics (free tiers vary)
  if (content.integrations?.ga4_measurement_id){
    const id = content.integrations.ga4_measurement_id.trim();
    if (id){
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(s);
      const inline = document.createElement('script');
      inline.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `;
      document.head.appendChild(inline);
    }
  }
  if (content.integrations?.meta_pixel_id){
    const pid = content.integrations.meta_pixel_id.trim();
    if (pid){
      const s = document.createElement('script');
      s.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pid}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(s);
    }
  }
})();
