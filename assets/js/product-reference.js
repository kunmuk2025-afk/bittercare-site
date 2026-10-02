/* Keep the supplied photograph while preserving all product copy as live HTML text. */
(() => {
  const section = document.querySelector('html[lang="ko"] .product-section');
  if (!section) return;
  const photo = section.querySelector('.product-image');
  if (!photo) return;
  const crop = document.createElement('span');
  crop.className = 'product-photo-exact';
  crop.setAttribute('role', 'img');
  crop.setAttribute('aria-label', '포근한 거실에서 비터케어 제품과 장난감 옆에 앉은 강아지');
  const image = document.createElement('img');
  image.src = 'assets/img/product-photo-v16.png';
  image.alt = '';
  image.width = 1122;
  image.height = 1402;
  image.loading = 'lazy';
  crop.append(image);
  photo.replaceChildren(crop);
  section.classList.add('product-photo-ready');

  const note = document.querySelector('html[lang="ko"] .v16-note > span:last-child');
  if (note) note.innerHTML = '<strong>특허 출원 기술을 바탕으로 구성한 성향 체크</strong><br>보호자의 관찰을 바탕으로 아이의 성향과 관리 방향을 살펴보세요.';
  document.querySelector('html[lang="ko"] .v16-patent')?.remove();
})();
