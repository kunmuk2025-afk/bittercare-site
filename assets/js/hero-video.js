(() => {
  const video = document.querySelector('.v16-hero-video');
  const button = document.querySelector('.v16-video-toggle');
  if (!video || !button) return;

  const icon = button.querySelector('span');
  const ui = window.bitterUI;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let manualPause = false, explicitPlay = false, inView = true;
  const lowData = () => navigator.connection?.saveData === true;
  const sync = () => {
    const paused = video.paused;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? (ui?.heroPlay || '랜딩 영상 재생') : (ui?.heroPause || '랜딩 영상 일시정지'));
    icon.textContent = paused ? '▶' : 'Ⅱ';
  };

  button.addEventListener('click', () => {
    if (video.paused) { manualPause=false; explicitPlay=true; video.play().catch(sync); }
    else { manualPause=true; explicitPlay=false; video.pause(); }
    sync();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  const update = () => {
    if (!document.hidden && inView && !manualPause && (explicitPlay || (!reduced.matches && !lowData()))) video.play().catch(sync);
    else video.pause();
  };
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', () => { explicitPlay=false; update(); });
  navigator.connection?.addEventListener?.('change', update);
  if ('IntersectionObserver' in window) {
    video.pause();
    new IntersectionObserver(entries => { inView=entries[0].isIntersecting; update(); }, {threshold:.08}).observe(video);
  } else update();
  sync();
})();
