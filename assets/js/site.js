/* Progressive enhancement: content, internal links and native FAQs work without JS. */
(() => {
  'use strict';
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-nav]');
  const modal = document.querySelector('[data-buy-modal]');
  let returnFocus = null;
  let menuInert = [];
  const syncLock = () => body.classList.toggle('no-scroll', !!document.querySelector('dialog[open]') || (menu && !menu.hidden));
  function closeMenu(restore = false) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', '메뉴 열기');
    menuInert.forEach(el => { el.inert = false; }); menuInert = [];
    syncLock();
    if (restore) menuButton?.focus();
  }
  menuButton?.addEventListener('click', () => {
    if (!menu) return;
    if (!menu.hidden) { closeMenu(true); return; }
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', '메뉴 닫기');
    menuInert = [...document.querySelectorAll('main, footer, .mobile-dock')].filter(el => !el.inert);
    menuInert.forEach(el => { el.inert = true; });
    syncLock();
    menu.querySelector('a')?.focus();
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu(true)));
  document.addEventListener('click', e => {
    if (menu && !menu.hidden && !menu.contains(e.target) && !menuButton.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (!menu || menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
    if (e.key === 'Tab') {
      const focusables = [menuButton, ...menu.querySelectorAll('a,button')];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  document.querySelectorAll('[data-open-buy]').forEach(button => button.addEventListener('click', e => {
    e.preventDefault();
    closeMenu();
    if (!modal) return;
    returnFocus = button;
    if (typeof modal.showModal === 'function') { modal.showModal(); syncLock(); }
    else { window.location.href = 'https://smartstore.naver.com/bittercare-bitterbooks'; }
  }));
  document.querySelectorAll('[data-close-buy]').forEach(button => button.addEventListener('click', () => modal?.close()));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  modal?.addEventListener('close', () => { syncLock(); returnFocus?.focus(); });

  // Autoplay is optional. Respect reduced motion, data saving, visibility and manual pause.
  const video = document.querySelector('.hero-video video');
  const videoButton = document.querySelector('[data-video-toggle]');
  if (video && videoButton) {
    let manualPause = false;
    let inView = true;
    let explicitPlay = false;
    const lowData = () => navigator.connection?.saveData === true;
    const updateVideoLabel = () => {
      videoButton.setAttribute('aria-label', video.paused ? '영상 재생' : '영상 일시정지');
      videoButton.innerHTML = video.paused ? '재생 <span aria-hidden="true">▷</span>' : '일시정지 <span aria-hidden="true">Ⅱ</span>';
    };
    const canPlay = () => !document.hidden && inView && !manualPause && (explicitPlay || (!reduced.matches && !lowData()));
    const reconcileVideo = () => {
      if (canPlay()) video.play().catch(updateVideoLabel);
      else video.pause();
    };
    video.addEventListener('play', updateVideoLabel);
    video.addEventListener('pause', updateVideoLabel);
    videoButton.addEventListener('click', () => {
      if (video.paused) { manualPause = false; explicitPlay = true; video.play().catch(updateVideoLabel); }
      else { manualPause = true; explicitPlay = false; video.pause(); }
    });
    video.addEventListener('error', () => {
      video.hidden = true; videoButton.hidden = true;
    });
    video.querySelector('source')?.addEventListener('error', () => { video.hidden = true; videoButton.hidden = true; });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting; reconcileVideo();
      }, { threshold: .08 });
      observer.observe(video);
    } else reconcileVideo();
    document.addEventListener('visibilitychange', reconcileVideo);
    reduced.addEventListener('change', () => { explicitPlay = false; reconcileVideo(); });
    navigator.connection?.addEventListener?.('change', reconcileVideo);
    updateVideoLabel();
  }

  // User-controlled usage steps with arrow-key and Home/End support.
  document.querySelectorAll('[data-stepper]').forEach(stepper => {
    const tabs = [...stepper.querySelectorAll('[data-step]')];
    const panels = [...stepper.querySelectorAll('[data-panel]')];
    const list = stepper.querySelector('.step-tabs');
    list.setAttribute('role', 'tablist');
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel'); panels[i].setAttribute('aria-labelledby', tab.id); panels[i].tabIndex = 0;
    });
    const activate = (index, focus = false, animate = true) => {
      tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
      if (focus) tabs[index].focus();
      if (animate && !reduced.matches && panels[index].animate) panels[index].animate([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:300,easing:'ease-out'});
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', e => {
        let next;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i + tabs.length - 1) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { e.preventDefault(); activate(next, true); }
      });
    });
    activate(0, false, false);
  });

  // Animation never leaves content hidden if scripting or observation fails.
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!reduced.matches && entry.target.animate) entry.target.animate([{opacity:.35,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}], {duration:650,easing:'cubic-bezier(.22,.75,.2,1)'});
      reveal.unobserve(entry.target);
    }), {threshold:.1});
    document.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el));
  }
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
    const answer = detail.querySelector('p');
    if (detail.open && answer?.animate && !reduced.matches) answer.animate([{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}], {duration:220,easing:'ease-out'});
  }));
  const progress = document.querySelector('.reading-progress');
  let ticking = false;
  function updateProgress() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0,window.scrollY / range)) : 0})`;
    ticking = false;
  }
  function queueProgress() { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }
  window.addEventListener('scroll', queueProgress, {passive:true});
  window.addEventListener('resize', queueProgress, {passive:true});
  window.addEventListener('load', updateProgress);
  updateProgress();
  if ('IntersectionObserver' in window) {
    const anchors = [...document.querySelectorAll('.subnav a[href^="#"]')];
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      anchors.forEach(a => { if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }), {rootMargin:'-15% 0px -60% 0px'});
    anchors.forEach(a => { const section = document.getElementById(a.hash.slice(1)); if (section) sectionObserver.observe(section); });
  }

  const search = document.getElementById('faq-search');
  if (search) {
    const wrapper = search.closest('.faq-search'); wrapper.hidden = false;
    const questions = [...wrapper.nextElementSibling.querySelectorAll('details')];
    const originalOpen = questions.map(q => q.open);
    const status = wrapper.querySelector('[data-search-status]');
    const normalize = s => s.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
    search.addEventListener('input', () => {
      const query = normalize(search.value); let found = 0;
      questions.forEach((question, i) => {
        const match = !query || normalize(question.textContent).includes(query);
        question.hidden = !match; question.open = query ? match : originalOpen[i];
        if (match) found++;
      });
      status.textContent = query ? (found ? (window.bitterLocale?.found(found) || `${found}개의 질문을 찾았어요.`) : (window.bitterLocale?.none || '일치하는 질문이 없어요. 다른 단어로 검색해 주세요.')) : '';
    });
  }

  // Keep text in supplied guide artwork legible on phones via a native lightbox.
  const guides = [...document.querySelectorAll('.photo-card img, .feature-card-media.portrait img')];
  if (guides.length && typeof HTMLDialogElement !== 'undefined') {
    const viewer = document.createElement('dialog'); viewer.className = 'image-dialog'; viewer.setAttribute('aria-labelledby','image-dialog-title');
    viewer.innerHTML = '<div class="image-dialog-bar"><strong id="image-dialog-title"></strong><button type="button" class="icon-btn" aria-label="확대 이미지 닫기" autofocus>×</button></div><img alt="">';
    body.append(viewer);
    const title = viewer.querySelector('strong'), fullImage = viewer.querySelector('img'); let opener;
    guides.forEach(img => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'guide-zoom'; button.setAttribute('aria-label', img.alt + ' 이미지 확대');
      img.parentNode.insertBefore(button, img); button.append(img);
      button.addEventListener('click', () => { opener = button; title.textContent = img.alt; fullImage.src = img.src; fullImage.alt = img.alt; viewer.showModal(); syncLock(); });
    });
    viewer.querySelector('button').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => { syncLock(); opener?.focus(); });
  }

  // Floating quick-access CTA appears once the hero has scrolled out of view.
  const floatCta = document.querySelector('[data-float-cta]');
  const heroSection = document.querySelector('.hero');
  if (floatCta && heroSection && 'IntersectionObserver' in window) {
    const ctaObserver = new IntersectionObserver(entries => {
      floatCta.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { rootMargin: '-10% 0px 0px 0px' });
    ctaObserver.observe(heroSection);
  }

  // Lightweight click ripple on primary buttons; purely decorative, skipped under reduced motion.
  if (!reduced.matches) {
    document.querySelectorAll('.btn').forEach(btn => btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }));
  }

  // Subtle pointer parallax on the hero visual; fine-pointer devices only, respects reduced motion.
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && window.matchMedia('(pointer:fine)').matches && !reduced.matches) {
    let raf = null;
    heroVisual.addEventListener('mousemove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = heroVisual.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - .5;
        const y = (e.clientY - rect.top) / rect.height - .5;
        heroVisual.style.transform = `rotateX(${(-y * 3.5).toFixed(2)}deg) rotateY(${(x * 3.5).toFixed(2)}deg)`;
        raf = null;
      });
    });
    heroVisual.addEventListener('mouseleave', () => { heroVisual.style.transform = ''; });
  }
})();
