/* BitterCare GA4: click analytics only; never send personal input values. */
(function () {
  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest && e.target.closest('a[href]');
    if (!link || typeof window.gtag !== 'function') return;
    try {
      var u = new URL(link.href, window.location.href);
      var host = u.hostname.toLowerCase();
      if (host === 'app.bittercare.com') {
        window.gtag('event', 'start_assessment_link', { link_location: window.location.pathname });
      } else if (host === 'smartstore.naver.com' || host === 'link.coupang.com' || host === 'item.gmarket.co.kr') {
        var store = host === 'smartstore.naver.com' ? 'naver' : host === 'link.coupang.com' ? 'coupang' : 'gmarket';
        window.gtag('event', 'select_store', { store_name: store, link_location: window.location.pathname });
      }
    } catch (_) { /* Do not interfere with normal navigation. */ }
  }, true);
})();
