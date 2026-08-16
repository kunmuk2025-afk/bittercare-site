export type ShareLang = "ko" | "en" | "zh" | "ja";
export type ShareKind = "temperament" | "chewing";
export type ShareAxis = { label: string; score: number; level?: string };

type ShareCardOptions = {
  lang: ShareLang;
  kind: ShareKind;
  petName: string;
  resultTitle: string;
  hook: string;
  description?: string;
  mbti?: string;
  breedImageSrc?: string;
  breedImagePosition?: string;
  axes?: ShareAxis[];
};

const APP_URL = "https://app.bittercare.com";
// Kakao JavaScript keys are browser-side identifiers and are restricted by the
// JavaScript SDK domain registered in Kakao Developers.
const KAKAO_JAVASCRIPT_KEY = "7fc2bba932391ee276459d26b6be1f83";
const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js";

type KakaoSdk = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    uploadImage: (options: { file: FileList }) => Promise<{ infos?: { original?: { url?: string } } }>;
    sendDefault: (options: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window { Kakao?: KakaoSdk; }
}

const shareCopy = {
  ko: {
    temperament: "우리 아이 기질은", chewing: "우리 아이 물어뜯기 유형은", mbti: "DOG MBTI", axes: "4가지 핵심 성향",
    chewAxes: "8개 행동축", tryTemperament: "우리 아이도 해보기", tryChewing: "우리 아이 물어뜯기 유형 확인하기",
    saved: "공유 이미지를 저장했어요.", copied: "링크가 복사되었습니다 🐶",
    instagram: "Instagram 공유창을 열었어요. 이미지 하단의 app.bittercare.com도 함께 보여요.",
    fallback: "공유창을 열 수 없어 이미지를 저장했어요. 참여 링크도 복사했어요.",
    kakaoError: "카카오톡 공유를 열지 못했어요. 링크 공유를 이용해 주세요.",
  },
  en: {
    temperament: "My dog’s temperament is", chewing: "My dog’s chewing style is", mbti: "DOG MBTI", axes: "4 CORE TRAITS",
    chewAxes: "8 BEHAVIOR AXES", tryTemperament: "Try it with your dog", tryChewing: "Check your dog’s chewing style",
    saved: "Share image saved.", copied: "Link copied 🐶", instagram: "The Instagram share sheet is open.",
    fallback: "Sharing was unavailable. The image was saved and the link was copied.", kakaoError: "Could not open KakaoTalk Share. Please use link sharing.",
  },
  zh: {
    temperament: "我家狗狗的气质是", chewing: "我家狗狗的啃咬类型是", mbti: "狗狗 MBTI", axes: "4个核心性格",
    chewAxes: "8个行为轴", tryTemperament: "也来测测你家狗狗", tryChewing: "查看爱犬的啃咬类型",
    saved: "分享图片已保存。", copied: "链接已复制 🐶", instagram: "已打开 Instagram 分享。",
    fallback: "无法打开分享窗口，图片已保存，参与链接也已复制。", kakaoError: "无法打开 KakaoTalk 分享，请使用链接分享。",
  },
  ja: {
    temperament: "うちの子の気質は", chewing: "うちの子の噛み癖タイプは", mbti: "DOG MBTI", axes: "4つのコア特性",
    chewAxes: "8つの行動軸", tryTemperament: "愛犬もチェック", tryChewing: "愛犬の噛み癖タイプを確認",
    saved: "共有画像を保存しました。", copied: "リンクをコピーしました 🐶", instagram: "Instagramの共有画面を開きました。",
    fallback: "共有画面を開けなかったため画像を保存し、参加リンクもコピーしました。", kakaoError: "カカオトーク共有を開けませんでした。リンク共有をご利用ください。",
  },
} as const;

export function shareUrl(kind: ShareKind, ref: string) {
  const type = kind === "temperament" ? "temperament" : "chewing";
  return `${APP_URL}/?ref=${encodeURIComponent(ref)}&type=${type}`;
}

async function createSharedResult(options: ShareCardOptions) {
  const response = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) throw new Error("share result creation failed");
  const data = await response.json() as { url: string };
  return data.url;
}

function linesFor(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const char of Array.from(text)) {
    const next = line + char;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = char;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLines(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const lines = linesFor(context, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return lines.length;
}

function fitFont(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number, start: number, min: number, weight = 900) {
  for (let size = start; size >= min; size -= 2) {
    context.font = `${weight} ${size}px 'Noto Sans KR', sans-serif`;
    if (linesFor(context, text, maxWidth).length <= maxLines) return size;
  }
  return min;
}

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function parsePosition(position = "50% 50%") {
  const values = position.split(" ").map((value) => Number.parseFloat(value));
  return { x: Number.isFinite(values[0]) ? values[0] : 50, y: Number.isFinite(values[1]) ? values[1] : 50 };
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, position = "50% 50%") {
  const atlas = image.width / image.height > 1.35 && position !== "50% 50%";
  if (atlas) {
    const pos = parsePosition(position);
    const cellWidth = image.width / 3;
    const cellHeight = image.height / 2;
    const column = pos.x < 25 ? 0 : pos.x > 75 ? 2 : 1;
    const row = pos.y < 50 ? 0 : 1;
    context.drawImage(image, column * cellWidth, row * cellHeight, cellWidth, cellHeight, x, y, width, height);
    return;
  }
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) * (parsePosition(position).x / 100);
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) * (parsePosition(position).y / 100);
  }
  context.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

async function drawDogPortrait(context: CanvasRenderingContext2D, options: ShareCardOptions, x: number, y: number, size: number, accent: string) {
  context.save();
  context.fillStyle = "#eef6ff";
  context.beginPath(); context.arc(x + size / 2, y + size / 2, size / 2 + 12, 0, Math.PI * 2); context.fill();
  context.lineWidth = 8; context.strokeStyle = accent; context.stroke();
  context.beginPath(); context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); context.clip();
  try {
    const image = await loadImage(options.breedImageSrc || "/home-v49-ref-tip-dog.png");
    drawCover(context, image, x, y, size, size, options.breedImagePosition);
  } catch {
    context.fillStyle = "#fff"; context.fillRect(x, y, size, size);
    context.fillStyle = accent; context.font = "160px sans-serif"; context.textAlign = "center";
    context.fillText("🐶", x + size / 2, y + size * .72); context.textAlign = "left";
  }
  context.restore();
}

function drawFooter(context: CanvasRenderingContext2D, label: string, accent: string) {
  context.fillStyle = "#071c45"; context.font = "800 34px 'Noto Sans KR', sans-serif"; context.fillText(label, 120, 1230);
  context.fillStyle = accent; context.font = "900 35px 'Noto Sans KR', sans-serif"; context.fillText(APP_URL.replace("https://", ""), 120, 1285);
}

function drawTemperamentAxes(context: CanvasRenderingContext2D, axes: ShareAxis[], accent: string, title: string) {
  context.fillStyle = accent;
  context.font = "850 24px 'Noto Sans KR', sans-serif";
  context.fillText(title, 110, 850);
  axes.slice(0, 4).forEach((axis, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 110 + col * 430;
    const y = 885 + row * 118;
    context.fillStyle = "#f5f8fd";
    context.beginPath(); context.roundRect(x, y, 390, 94, 24); context.fill();
    context.strokeStyle = "#dce7f5"; context.lineWidth = 2; context.stroke();
    context.fillStyle = "#536980"; context.font = "750 22px 'Noto Sans KR', sans-serif"; context.fillText(axis.label, x + 24, y + 35);
    context.fillStyle = "#071c45"; context.font = "900 27px 'Noto Sans KR', sans-serif"; context.fillText(axis.level || "", x + 24, y + 70);
    context.fillStyle = "#e3ebf6"; context.beginPath(); context.roundRect(x + 205, y + 48, 150, 14, 7); context.fill();
    context.fillStyle = accent; context.beginPath(); context.roundRect(x + 205, y + 48, 150 * Math.max(0, Math.min(100, axis.score)) / 100, 14, 7); context.fill();
  });
}

async function buildBlob(options: ShareCardOptions) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  const labels = shareCopy[options.lang];
  const accent = options.kind === "temperament" ? "#2f6df6" : "#7054e8";
  const gradient = context.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#f8fbff"); gradient.addColorStop(.58, options.kind === "temperament" ? "#edf6ff" : "#f3efff"); gradient.addColorStop(1, "#efffe9");
  context.fillStyle = gradient; context.fillRect(0, 0, 1080, 1350);
  context.fillStyle = "rgba(255,255,255,.95)"; context.beginPath(); context.roundRect(54, 54, 972, 1242, 60); context.fill();
  context.fillStyle = "#075bd8"; context.font = "900 56px 'Noto Sans KR', sans-serif"; context.fillText("🐾 BitterCare", 110, 145);
  context.fillStyle = accent; context.font = "800 31px 'Noto Sans KR', sans-serif"; context.fillText(options.kind === "temperament" ? labels.temperament : labels.chewing, 110, 235);
  context.fillStyle = "#071c45"; fitFont(context, options.resultTitle, 820, 2, 76, 52, 950); drawLines(context, options.resultTitle, 110, 335, 820, 86, 2);
  await drawDogPortrait(context, options, 700, 440, 230, accent);

  if (options.kind === "temperament") {
    context.fillStyle = accent; context.font = "850 25px 'Noto Sans KR', sans-serif"; context.fillText(labels.mbti, 110, 520);
    context.fillStyle = "#071c45"; context.font = "950 66px 'Noto Sans KR', sans-serif"; context.fillText(options.mbti || "—", 110, 588);
    context.fillStyle = "#4b607c"; fitFont(context, options.description || options.hook, 530, 4, 31, 24, 600); drawLines(context, options.description || options.hook, 110, 675, 530, 46, 4);
    drawTemperamentAxes(context, options.axes || [], accent, labels.axes);
  } else {
    context.fillStyle = "#4b607c"; fitFont(context, options.description || options.hook, 530, 5, 32, 24, 600); drawLines(context, options.description || options.hook, 110, 510, 530, 46, 5);
    const axes = (options.axes || []).slice(0, 8);
    context.fillStyle = accent; context.font = "850 25px 'Noto Sans KR', sans-serif"; context.fillText(labels.chewAxes, 110, 760);
    axes.forEach((axis, index) => {
      const column = index % 2; const row = Math.floor(index / 2); const x = 110 + column * 440; const y = 805 + row * 78;
      context.fillStyle = "#52657d"; context.font = "700 23px 'Noto Sans KR', sans-serif"; context.fillText(axis.label, x, y);
      context.fillStyle = "#e7edf6"; context.beginPath(); context.roundRect(x, y + 17, 320, 16, 8); context.fill();
      context.fillStyle = accent; context.beginPath(); context.roundRect(x, y + 17, 320 * Math.max(0, Math.min(100, axis.score)) / 100, 16, 8); context.fill();
      context.fillStyle = "#071c45"; context.font = "850 23px 'Noto Sans KR', sans-serif"; context.fillText(String(axis.score), x + 335, y + 3);
    });
  }
  drawFooter(context, options.kind === "temperament" ? labels.tryTemperament : labels.tryChewing, accent);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("image failed")), "image/png"));
}

async function buildKakaoSummaryBlob(options: ShareCardOptions) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  const labels = shareCopy[options.lang];
  const accent = options.kind === "temperament" ? "#2f6df6" : "#7054e8";
  const gradient = context.createLinearGradient(0,0,1200,630);
  gradient.addColorStop(0,"#f7fbff"); gradient.addColorStop(1,"#eef8ff");
  context.fillStyle=gradient; context.fillRect(0,0,1200,630);
  context.fillStyle="#fff"; context.beginPath(); context.roundRect(34,34,1132,562,36); context.fill();
  // generous safe area prevents Kakao preview cropping the brand.
  context.fillStyle="#075bd8"; context.font="900 44px 'Noto Sans KR', sans-serif"; context.fillText("🐾 BitterCare",76,105);
  context.fillStyle=accent; context.font="800 26px 'Noto Sans KR', sans-serif"; context.fillText(options.kind === "temperament" ? labels.temperament : labels.chewing,76,165);
  context.fillStyle="#071c45"; fitFont(context,options.resultTitle,700,2,58,42,950); drawLines(context,options.resultTitle,76,238,700,66,2);
  await drawDogPortrait(context,options,875,150,210,accent);
  if (options.kind === "temperament") {
    context.fillStyle=accent; context.font="850 22px 'Noto Sans KR', sans-serif"; context.fillText(labels.mbti,76,390);
    context.fillStyle="#071c45"; context.font="950 48px 'Noto Sans KR', sans-serif"; context.fillText(options.mbti||"—",76,443);
    const axes=(options.axes||[]).slice(0,4);
    axes.forEach((a,i)=>{ const x=330+(i%2)*250, y=365+Math.floor(i/2)*92; context.fillStyle="#f4f7fb"; context.beginPath(); context.roundRect(x,y,225,70,18); context.fill(); context.fillStyle="#536980"; context.font="700 17px 'Noto Sans KR', sans-serif"; context.fillText(a.label,x+14,y+25); context.fillStyle="#071c45"; context.font="900 20px 'Noto Sans KR', sans-serif"; context.fillText(a.level||"",x+14,y+51); });
  } else {
    context.fillStyle="#4b607c"; fitFont(context,options.description||options.hook,690,3,27,22,650); drawLines(context,options.description||options.hook,76,395,690,39,3);
  }
  context.fillStyle=accent; context.font="900 27px 'Noto Sans KR', sans-serif"; context.fillText("자세한 결과 보기  →",76,555);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("image failed")),"image/png"));
}

function download(blob: Blob, kind: ShareKind) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = `bittercare-${kind}-result.png`;
  document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function shareText(options: ShareCardOptions) {
  const dog = options.petName.trim() || ({ ko: "우리 아이", en: "My dog", zh: "我家狗狗", ja: "うちの子" } as const)[options.lang];
  return options.kind === "temperament"
    ? ({ ko: `${dog}는 '${options.resultTitle}'이래요 🐶`, en: `${dog} is a “${options.resultTitle}” 🐶`, zh: `${dog}是“${options.resultTitle}”🐶`, ja: `${dog}は「${options.resultTitle}」でした🐶` } as const)[options.lang]
    : ({ ko: `${dog}의 물어뜯기 유형은 '${options.resultTitle}'이래요 🐶`, en: `${dog} has a “${options.resultTitle}” chewing style 🐶`, zh: `${dog}的啃咬类型是“${options.resultTitle}”🐶`, ja: `${dog}の噛み癖タイプは「${options.resultTitle}」でした🐶` } as const)[options.lang];
}

async function ensureKakao() {
  if (!window.Kakao) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${KAKAO_SDK_URL}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Kakao SDK load failed")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = KAKAO_SDK_URL;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Kakao SDK load failed"));
      document.head.appendChild(script);
    });
  }
  if (!window.Kakao) throw new Error("Kakao SDK unavailable");
  if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
  return window.Kakao;
}

function toFileList(file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  return transfer.files;
}

export async function saveShareCard(options: ShareCardOptions) {
  const blob = await buildBlob(options); download(blob, options.kind); return shareCopy[options.lang].saved;
}

export async function copyShareLink(options: ShareCardOptions) {
  const url = await createSharedResult(options);
  await navigator.clipboard.writeText(url);
  return shareCopy[options.lang].copied;
}

export async function shareLinkOnly(options: ShareCardOptions) {
  const url = await createSharedResult(options);
  if (navigator.share) {
    await navigator.share({ title: "BitterCare", text: shareText(options), url });
    return "shared";
  }
  await navigator.clipboard.writeText(url);
  return shareCopy[options.lang].copied;
}

export async function shareInstagramCard(options: ShareCardOptions) {
  const blob = await buildBlob(options);
  const file = new File([blob], `bittercare-${options.kind}-instagram.png`, { type: "image/png" });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ files: [file] });
    return shareCopy[options.lang].instagram;
  }
  download(blob, options.kind);
  return shareCopy[options.lang].saved;
}

export async function shareKakaoCard(options: ShareCardOptions) {
  try {
    const kakao = await ensureKakao();
    const blob = await buildKakaoSummaryBlob(options);
    const file = new File([blob], `bittercare-${options.kind}-kakao.png`, { type: "image/png" });
    let imageUrl = `${APP_URL}/${options.kind === "temperament" ? "home-v49-ref-temperament.png" : "home-v49-ref-chew.png"}`;
    try {
      const uploaded = await kakao.Share.uploadImage({ file: toFileList(file) });
      imageUrl = uploaded.infos?.original?.url || imageUrl;
    } catch {
      // Keep a public BitterCare fallback image so link sharing still works.
    }
    const url = await createSharedResult(options);
    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `${shareText(options)}`,
        description: options.kind === "temperament" && options.mbti ? `DOG MBTI · ${options.mbti}` : options.hook,
        imageUrl,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: options.lang === "ko" ? "자세한 결과 보기" : "View full result", link: { mobileWebUrl: url, webUrl: url } },
        { title: options.kind === "temperament" ? shareCopy[options.lang].tryTemperament : shareCopy[options.lang].tryChewing, link: { mobileWebUrl: `${APP_URL}/?ref=kakao&type=${options.kind}`, webUrl: `${APP_URL}/?ref=kakao&type=${options.kind}` } },
      ],
    });
    return "shared";
  } catch {
    return shareCopy[options.lang].kakaoError;
  }
}

// Kept for compatibility with older callers. V59 UI uses platform-specific actions.
export async function shareResultCard(options: ShareCardOptions) {
  return shareLinkOnly(options);
}
