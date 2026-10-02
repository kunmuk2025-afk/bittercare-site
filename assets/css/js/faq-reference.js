/* Preserve the supplied artwork, with real keyboard-accessible FAQ controls. */
(() => {
  const section = document.querySelector('html[lang="ko"] .home-faq');
  if (!section) return;
  const original = section.querySelector('.faq-layout');
  const questions = [...original.querySelectorAll('details')].map(item => ({
    title: item.querySelector('summary').textContent.trim(),
    answer: item.querySelector('p').textContent.trim()
  }));
  const asset = 'assets/img/faq-exact-reference-v16.png';
  const frame = document.createElement('div');
  frame.className = 'faq-exact';
  const artwork = document.createElement('div');
  artwork.className = 'faq-exact-art';
  const image = document.createElement('img');
  image.src = asset;
  image.alt = '잠깐, 이건 궁금하죠. 포근한 러그 위에서 의자 옆에 기대어 쉬는 강아지';
  image.width = 2027;
  image.height = 776;
  image.loading = 'lazy';
  artwork.append(image);
  frame.append(artwork);
  const more = document.createElement('a');
  more.className = 'faq-exact-more';
  more.href = original.querySelector('a').getAttribute('href');
  more.setAttribute('aria-label', '질문 더 보기');
  frame.append(more);
  const controls = document.createElement('div');
  controls.className = 'faq-exact-controls';
  const answer = document.createElement('div');
  answer.className = 'faq-exact-answer';
  answer.id = 'faq-exact-answer';
  answer.hidden = true;
  answer.setAttribute('role', 'region');
  const title = document.createElement('h3');
  title.id = 'faq-exact-answer-title';
  const body = document.createElement('p');
  answer.setAttribute('aria-labelledby', title.id);
  answer.append(title, body);
  questions.forEach((question, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq-exact-question';
    button.style.setProperty('--row', index);
    button.setAttribute('aria-label', question.title);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', answer.id);
    const label = document.createElement('span');
    label.className = 'faq-exact-label';
    label.textContent = question.title;
    const plus = document.createElement('span');
    plus.className = 'faq-exact-plus';
    plus.setAttribute('aria-hidden', 'true');
    plus.textContent = '+';
    const crop = document.createElement('img');
    crop.src = asset;
    crop.alt = '';
    crop.setAttribute('aria-hidden', 'true');
    button.append(crop, label, plus);
    button.addEventListener('click', () => {
      const wasOpen = button.getAttribute('aria-expanded') === 'true';
      controls.querySelectorAll('button').forEach(control => control.setAttribute('aria-expanded', 'false'));
      answer.hidden = wasOpen;
      if (!wasOpen) {
        button.setAttribute('aria-expanded', 'true');
        title.textContent = question.title;
        body.textContent = question.answer;
        answer.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest'});
      }
    });
    controls.append(button);
  });
  frame.append(controls);
  section.append(frame, answer);
  original.hidden = true;
  section.classList.add('faq-exact-ready');
})();
