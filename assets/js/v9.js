(() => {
'use strict';
const supported=['ko','en','ja','zh-CN','vi'];
const parts=location.pathname.split('/').filter(Boolean);
const lang=supported.includes(document.documentElement.lang)?document.documentElement.lang:'ko';
const leaf=parts.at(-1)||'';
const file=(!leaf||supported.includes(leaf))?'index.html':(leaf.endsWith('.html')?leaf:leaf+'.html');

const words={ko:{open:'메뉴 열기',close:'메뉴 닫기',zoom:'이미지 확대',closeImage:'확대 이미지 닫기',none:'일치하는 질문이 없어요. 다른 단어로 검색해 주세요.',found:n=>`${n}개의 질문을 찾았어요.`},en:{open:'Open menu',close:'Close menu',zoom:'Enlarge image',closeImage:'Close image',none:'No matching questions. Try another word.',found:n=>`${n} questions found.`},ja:{open:'メニューを開く',close:'メニューを閉じる',zoom:'画像を拡大',closeImage:'画像を閉じる',none:'一致する質問がありません。別の言葉で検索してください。',found:n=>`${n}件の質問が見つかりました。`},'zh-CN':{open:'打开菜单',close:'关闭菜单',zoom:'放大图片',closeImage:'关闭图片',none:'没有匹配的问题，请尝试其他关键词。',found:n=>`找到${n}个问题。`}};
words.vi={open:'Mở menu',close:'Đóng menu',zoom:'Phóng to ảnh',closeImage:'Đóng ảnh',none:'Không tìm thấy câu hỏi phù hợp. Hãy thử từ khác.',found:n=>`Tìm thấy ${n} câu hỏi.`};
window.bitterLocale=words[lang];
const select=document.getElementById('site-language');
if(select){select.value=lang;select.addEventListener('change',()=>{const next=select.value;try{localStorage.setItem('bittercare-language',next)}catch{};location.href=(lang==='ko'?'':'../')+(next==='ko'?'':next+'/')+file+location.hash;});}
// Respect a visitor's saved choice when they return via a Korean URL.
try{const saved=localStorage.getItem('bittercare-language');if(lang==='ko'&&saved&&saved!=='ko'&&supported.includes(saved)){location.replace(saved+'/'+file+location.hash);return;}}catch{}
document.querySelectorAll('[data-back]').forEach(a=>a.addEventListener('click',e=>{try{const prev=new URL(document.referrer);if(prev.origin===location.origin&&history.length>1){e.preventDefault();history.back();}}catch{}}));
const menu=document.querySelector('[data-menu-toggle]');
if(menu){const update=()=>{const value=menu.getAttribute('aria-expanded')==='true'?words[lang].close:words[lang].open;if(menu.getAttribute('aria-label')!==value)menu.setAttribute('aria-label',value)};update();new MutationObserver(update).observe(menu,{attributes:true,attributeFilter:['aria-expanded','aria-label']});}
document.querySelectorAll('.guide-zoom').forEach(b=>b.setAttribute('aria-label',words[lang].zoom));
document.querySelector('.image-dialog button')?.setAttribute('aria-label',words[lang].closeImage);
})();
