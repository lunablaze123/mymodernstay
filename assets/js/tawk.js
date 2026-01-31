(function(){
  function injectTawk(propertyId, widgetId){
    if (!propertyId || !widgetId) return;
    // Standard tawk embed snippet, but values come from content.json
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin','*');
    const s0 = document.getElementsByTagName("script")[0];
    s0.parentNode.insertBefore(s1, s0);
  }
  window.MMS_injectTawk = injectTawk;
})();
