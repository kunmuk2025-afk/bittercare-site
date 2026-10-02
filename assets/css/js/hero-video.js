(() => {
  const video = document.querySelector('.v16-hero-video');
  const button = document.querySelector('.v16-video-toggle');
  if (!video || !button) return;

  const icon = button.querySelector('span');
  const sync = () => {
    const paused = video.paused;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? '랜딩 영상 재생' : '랜딩 영상 일시정지');
    icon.textContent = paused ? '▶' : 'Ⅱ';
  };

  button.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    sync();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.play().catch(sync);
  sync();
})();
