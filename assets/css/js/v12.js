/* V12: accessible language navigation and a once-per-view slogan reveal. */
(() => {
  'use strict';
  const language = document.querySelector('.v12-language');
  document.querySelectorAll('[data-language]').forEach(link => {
    link.addEventListener('click', () => {
      try { localStorage.setItem('bittercare-language', link.dataset.language); } catch (_) {}
    });
  });
  document.addEventListener('click', e => {
    if (language && !language.contains(e.target)) language.open = false;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && language?.open) {
      language.open = false;
      language.querySelector('summary').focus();
    }
  });
  const slogan = document.querySelector('.v12-slogan');
  if (slogan) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          slogan.classList.add('is-visible');
          observer.disconnect();
        }
      }, { threshold: .35 });
      observer.observe(slogan);
    } else slogan.classList.add('is-visible');
  }
})();
