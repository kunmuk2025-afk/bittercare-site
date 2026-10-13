(() => {
  const video = document.querySelector('.review-film video');
  const button = document.querySelector('.review-video-toggle');
  if (!video || !button) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let manualPause = reduced.matches;
  let inView = false;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  const sync = () => {
    button.textContent = video.paused ? '재생' : '일시정지';
    button.setAttribute('aria-label', video.paused ? '사용 영상 재생' : '사용 영상 일시정지');
    button.setAttribute('aria-pressed', String(video.paused));
  };
  const update = () => {
    if (inView && !document.hidden && !manualPause) video.play().catch(sync);
    else video.pause();
  };
  button.addEventListener('click', () => {
    manualPause = !video.paused;
    if (manualPause) video.pause();
    else video.play().catch(sync);
    sync();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      update();
    }, { threshold: 0.15 }).observe(video);
  } else {
    inView = true;
    update();
  }
  reduced.addEventListener('change', e => { manualPause = e.matches; update(); });
  sync();
})();
