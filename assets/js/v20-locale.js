(() => {
  const lang=document.documentElement.lang;
  const locales={
    ko:{open:'메뉴 열기',close:'메뉴 닫기',shop:'편한 곳에서 만나요.',size:'비터케어 {n}M 구매처',play:'재생',pause:'일시정지',heroPlay:'랜딩 영상 재생',heroPause:'랜딩 영상 일시정지',reviewPlay:'사용 영상 재생',reviewPause:'사용 영상 일시정지',closeImage:'확대 이미지 닫기'},
    en:{open:'Open menu',close:'Close menu',shop:'Choose your store.',size:'BitterCare {n}M stores',play:'Play',pause:'Pause',heroPlay:'Play introduction video',heroPause:'Pause introduction video',reviewPlay:'Play usage video',reviewPause:'Pause usage video',closeImage:'Close enlarged image'},
    ja:{open:'メニューを開く',close:'メニューを閉じる',shop:'購入先をお選びください。',size:'BitterCare {n}Mの購入先',play:'再生',pause:'一時停止',heroPlay:'紹介動画を再生',heroPause:'紹介動画を一時停止',reviewPlay:'使用動画を再生',reviewPause:'使用動画を一時停止',closeImage:'拡大画像を閉じる'},
    'zh-CN':{open:'打开菜单',close:'关闭菜单',shop:'请选择购买渠道。',size:'BitterCare {n}M购买渠道',play:'播放',pause:'暂停',heroPlay:'播放介绍视频',heroPause:'暂停介绍视频',reviewPlay:'播放使用视频',reviewPause:'暂停使用视频',closeImage:'关闭放大图片'},
    vi:{open:'Mở menu',close:'Đóng menu',shop:'Chọn nơi mua hàng.',size:'Nơi mua BitterCare {n}M',play:'Phát',pause:'Tạm dừng',heroPlay:'Phát video giới thiệu',heroPause:'Tạm dừng video giới thiệu',reviewPlay:'Phát video sử dụng',reviewPause:'Tạm dừng video sử dụng',closeImage:'Đóng ảnh phóng to'}
  };
  window.bitterUI=locales[lang]||locales.ko;
  // Clean URLs are used on Pages. Local file previews resolve to physical HTML files.
  if(location.protocol==='file:')document.querySelectorAll('a[href]').forEach(a=>{
    const href=a.getAttribute('href');if(/^(https?:|mailto:|tel:|data:|#)/.test(href))return;
    const [raw,fragment]=href.split('#');const [pathname,query]=raw.split('?');
    if(/\.[a-z0-9]+$/i.test(pathname))return;
    a.setAttribute('href',pathname+(pathname.endsWith('/')?'index.html':'.html')+(query?'?'+query:'')+(fragment?'#'+fragment:''));
  });
})();
