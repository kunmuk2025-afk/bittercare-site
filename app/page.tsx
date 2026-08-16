"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type BreedProfileKey, type LangKey } from "./breed-guides";
import { temperamentText } from "./temperament-data";
import { calculateTemperamentProfile, temperamentAxisLabels, temperamentAxisLevel, temperamentAxisOrder } from "./temperament-profiles";
import { quizBank, quizFeedback } from "./quiz-bank";
import { calculateChewResult, chewAxisLabels, chewAxisOrder, chewQuestions, chewScale } from "./chew-assessment";
import { copyShareLink, saveShareCard, shareInstagramCard, shareKakaoCard, shareLinkOnly, type ShareAxis, type ShareKind } from "./share-card";

type Lang = LangKey;
type Screen = "home" | "guide" | "quiz" | "chew" | "chewPlan" | "product" | "programGate" | "program";
type BreedKey = BreedProfileKey;

type Breed = {
  key: BreedKey;
};

type BreedImage = {
  src: string;
  position?: string;
};

type DiaryEntry = {
  id?: string;
  sessionId?: string;
  day: number;
  note: string;
  comparison: string;
  approachCount: string;
  chewed: string;
  bitterReaction: string;
  adhesion: string;
  helpRequested: boolean;
  photoUrl: string | null;
  savedAt: string | null;
};

type ObservationReport = {
  id: string;
  sessionId: string;
  resultType: "positive" | "partial" | "observe" | "application";
  summary: string;
  data: Record<string, unknown>;
  createdAt: string;
};

type ObservationSession = {
  id: string;
  caseId: string;
  breed: string;
  petName: string;
  dogAge: string;
  target: string;
  temperamentResult: string;
  language: Lang;
  status: "active" | "completed";
  startedAt: string;
  completedAt: string | null;
  entries: DiaryEntry[];
  report: ObservationReport | null;
};

type AssessmentSavePayload = {
  caseId: string;
  assessmentType: "temperament" | "chewing";
  breed: string;
  petName: string;
  language: Lang;
  answers: unknown;
  result: unknown;
};

type FunnelEventType = "app_visit" | "temperament_start" | "temperament_complete" | "temperament_share_click" | "temperament_image_save" | "chew_start" | "chew_complete" | "chew_result_view" | "chew_share_click" | "chew_image_save" | "product_view" | "buy_button_click" | "coupang_click" | "smartstore_click" | "program_start";

type FunnelEventPayload = {
  caseId: string;
  eventType: FunnelEventType;
  breed?: string;
  petName?: string;
  dogAge?: string;
  chewType?: string;
  chewingTarget?: string;
  language: Lang;
  screen: string;
  store?: string;
};

type TrackFunnel = (eventType: FunnelEventType, screen: string, store?: string, beacon?: boolean) => void;

async function saveAssessment(payload: AssessmentSavePayload) {
  const response = await fetch("/api/assessments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("assessment-save-failed");
}

function saveFunnelEvent(payload: FunnelEventPayload, beacon = false) {
  const body = JSON.stringify(payload);
  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    if (queued) return Promise.resolve();
  }
  return fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).then(() => undefined).catch(() => undefined);
}

async function compressDiaryPhoto(file: File): Promise<File> {
  const maxDimension = 1800;
  const targetBytes = 2 * 1024 * 1024;
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxDimension / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale === 1 && file.size <= targetBytes) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let blob: Blob | null = null;
    for (const quality of [0.82, 0.72, 0.62]) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= targetBytes) break;
    }
    if (!blob) return file;
    if (blob.size >= file.size && file.size <= targetBytes) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "bittercare-photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // HEIC/HEIF 등 브라우저에서 디코딩하지 못하는 형식은 원본을 그대로 사용합니다.
    return file;
  }
}

const languages: { key: Lang; label: string }[] = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "zh", label: "中文" },
  { key: "ja", label: "日本語" },
];

const experienceCopy: Record<Lang, {
  firstBadge: string; firstTitle: string; firstBody: string; firstCta: string;
  chewBadge: string; chewTitle: string; chewBody: string; chewCta: string;
  chewScreenTitle: string; chewScreenLead: string; chewPlanCta: string; chewPlanTitle: string; chewPlanLead: string;
  resultCta: string; planBadge: string; planRevealTitle: string; planRevealBody: string; planRevealCta: string;
  reselectBreed: string; actionPageBadge: string; actionPageTitle: string; actionPageLead: string; backToResult: string;
  openAction: string; closeAction: string; backToTraits: string;
}> = {
  ko: { firstBadge: "FIRST · 우리 아이부터", firstTitle: "먼저, 우리 아이의\n기질을 확인해보세요", firstBody: "15가지 일상 반응을 바탕으로 우리 아이에게 가까운 행동 프로필을 찾아드립니다.", firstCta: "우리 아이 기질체크 시작", chewBadge: "OPTION · 물어뜯기 고민", chewTitle: "가구나 전선을\n자꾸 물어뜯나요?", chewBody: "해당될 때만 눌러주세요. 물건과 시간대에 맞춘 관리법을 안내해드립니다.", chewCta: "물어뜯기 맞춤 케어", chewScreenTitle: "무엇을 물어뜯는지\n알려주세요", chewScreenLead: "우리 아이의 상황에 해당하는 항목만 선택해주세요.", chewPlanCta: "맞춤 물어뜯기 관리법 보기", chewPlanTitle: "이 순서로 시작해보세요", chewPlanLead: "선택한 물건과 시간대에 맞춘 기본 관리 순서입니다.", resultCta: "우리 아이 기질 보기", planBadge: "우리 아이 맞춤 행동 가이드", planRevealTitle: "이 행동유형에는 어떻게 대처해야 할까요?", planRevealBody: "우리 아이가 보내는 신호에 맞춘 대처 순서와 피해야 할 반응을 확인해보세요.", planRevealCta: "행동유형 맞춤 대처법 보기", reselectBreed: "견종 다시 선택하기", actionPageBadge: "PERSONAL ACTION PLAN", actionPageTitle: "우리 아이에게 맞는\n대처 방법", actionPageLead: "혼내기보다 상황을 바꾸고, 좋은 선택을 바로 알려주는 순서입니다.", backToResult: "행동유형으로 돌아가기", openAction: "자세히 보기", closeAction: "접기", backToTraits: "기질 홈으로" },
  en: { firstBadge: "FIRST · START WITH YOUR DOG", firstTitle: "Begin with your dog’s\ntemperament", firstBody: "Use 15 everyday reactions to find the behavior profile closest to your dog.", firstCta: "Start temperament check", chewBadge: "OPTION · CHEWING CONCERN", chewTitle: "Chewing furniture\nor cables?", chewBody: "Open this only when it applies. Get guidance based on the object and timing.", chewCta: "Personalized chewing care", chewScreenTitle: "What does your dog\nchew most?", chewScreenLead: "Choose only what matches your dog’s current situation.", chewPlanCta: "View my chewing guide", chewPlanTitle: "Start in this order", chewPlanLead: "A basic plan tailored to the selected object and time.", resultCta: "View my dog’s temperament", planBadge: "PERSONAL BEHAVIOR GUIDE", planRevealTitle: "How should I respond to this behavior pattern?", planRevealBody: "See an action order matched to your dog’s signals and reactions to avoid.", planRevealCta: "View behavior response guide", reselectBreed: "Choose breed again", actionPageBadge: "PERSONAL ACTION PLAN", actionPageTitle: "A response plan\nfor your dog", actionPageLead: "Change the situation first, then make the good choice easy and rewarding.", backToResult: "Back to behavior profile", openAction: "View details", closeAction: "Close", backToTraits: "Back to temperament" },
  zh: { firstBadge: "优先 · 先了解爱犬", firstTitle: "首先，了解爱犬的\n日常气质", firstBody: "通过15种日常反应，找到更接近爱犬的行为画像。", firstCta: "开始气质测试", chewBadge: "可选 · 啃咬困扰", chewTitle: "总是啃咬家具\n或电线吗？", chewBody: "仅在有此困扰时点击，根据物品和时间提供管理方法。", chewCta: "啃咬定制护理", chewScreenTitle: "请告诉我们爱犬\n最常啃咬什么", chewScreenLead: "只选择符合当前情况的项目。", chewPlanCta: "查看定制啃咬方法", chewPlanTitle: "请按此顺序开始", chewPlanLead: "根据所选物品和时间制定的基础管理方案。", resultCta: "查看爱犬气质", planBadge: "爱犬专属行为指南", planRevealTitle: "面对这种行为类型该怎么做？", planRevealBody: "查看符合爱犬信号的应对顺序，以及需要避免的反应。", planRevealCta: "查看行为应对方法", reselectBreed: "重新选择犬种", actionPageBadge: "专属行动方案", actionPageTitle: "适合爱犬的\n应对方法", actionPageLead: "先改变情境，再让正确选择变得简单并及时奖励。", backToResult: "返回行为画像", openAction: "查看详情", closeAction: "收起", backToTraits: "返回气质首页" },
  ja: { firstBadge: "FIRST · まず愛犬から", firstTitle: "最初に、愛犬の\n気質を確認しましょう", firstBody: "15の日常反応から、愛犬に近い行動プロフィールを探します。", firstCta: "気質チェックを始める", chewBadge: "OPTION · 噛む悩み", chewTitle: "家具やコードを\nよく噛みますか？", chewBody: "当てはまる時だけ開き、物と時間帯に合わせたケアをご案内します。", chewCta: "噛み癖の個別ケア", chewScreenTitle: "何をよく噛むか\n教えてください", chewScreenLead: "今の状況に当てはまる項目だけ選んでください。", chewPlanCta: "噛み癖の個別ケアを見る", chewPlanTitle: "この順番で始めましょう", chewPlanLead: "選んだ物と時間帯に合わせた基本管理です。", resultCta: "愛犬の気質を見る", planBadge: "愛犬に合わせた行動ガイド", planRevealTitle: "この行動タイプにはどう対応する？", planRevealBody: "愛犬のサインに合う対応の順番と、避けたい反応を確認しましょう。", planRevealCta: "行動タイプ別の対応を見る", reselectBreed: "犬種を選び直す", actionPageBadge: "PERSONAL ACTION PLAN", actionPageTitle: "愛犬に合う\n対応方法", actionPageLead: "叱る前に状況を変え、良い選択を簡単にしてすぐ褒める順番です。", backToResult: "行動タイプへ戻る", openAction: "詳しく見る", closeAction: "閉じる", backToTraits: "気質ホームへ" },
};

const chewTargetPositions = ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%"];

const breedNames = {
  maltese: { ko: "말티즈", en: "Maltese", zh: "马尔济斯", ja: "マルチーズ" },
  bichon: { ko: "비숑", en: "Bichon", zh: "比熊", ja: "ビション" },
  poodle: { ko: "토이푸들", en: "Toy Poodle", zh: "玩具贵宾", ja: "トイプードル" },
  pomeranian: { ko: "포메라니안", en: "Pomeranian", zh: "博美", ja: "ポメラニアン" },
  dachshund: { ko: "닥스훈트", en: "Dachshund", zh: "腊肠犬", ja: "ダックスフンド" },
  mixed: { ko: "믹스견", en: "Mixed Breed", zh: "混种犬", ja: "ミックス犬" },
  shihTzu: { ko: "시츄", en: "Shih Tzu", zh: "西施犬", ja: "シーズー" },
  chihuahua: { ko: "치와와", en: "Chihuahua", zh: "吉娃娃", ja: "チワワ" },
  yorkie: { ko: "요크셔테리어", en: "Yorkshire Terrier", zh: "约克夏", ja: "ヨークシャー" },
  minpin: { ko: "미니핀", en: "Miniature Pinscher", zh: "迷你杜宾", ja: "ミニピン" },
  corgi: { ko: "웰시코기", en: "Welsh Corgi", zh: "柯基", ja: "ウェルシュ・コーギー" },
  shiba: { ko: "시바", en: "Shiba Inu", zh: "柴犬", ja: "柴犬" },
  frenchie: { ko: "프렌치불독", en: "French Bulldog", zh: "法国斗牛犬", ja: "フレンチブルドッグ" },
  pug: { ko: "퍼그", en: "Pug", zh: "巴哥犬", ja: "パグ" },
  beagle: { ko: "비글", en: "Beagle", zh: "比格犬", ja: "ビーグル" },
  schnauzer: { ko: "슈나우저", en: "Schnauzer", zh: "雪纳瑞", ja: "シュナウザー" },
  borderCollie: { ko: "보더콜리", en: "Border Collie", zh: "边境牧羊犬", ja: "ボーダーコリー" },
  golden: { ko: "골든리트리버", en: "Golden Retriever", zh: "金毛寻回犬", ja: "ゴールデン" },
  labrador: { ko: "래브라도", en: "Labrador", zh: "拉布拉多", ja: "ラブラドール" },
  samoyed: { ko: "사모예드", en: "Samoyed", zh: "萨摩耶", ja: "サモエド" },
  jindo: { ko: "진돗개", en: "Jindo", zh: "珍岛犬", ja: "珍島犬" },
  spitz: { ko: "스피츠", en: "Japanese Spitz", zh: "日本尖嘴犬", ja: "日本スピッツ" },
  unknown: { ko: "잘 모르겠어요", en: "Not sure", zh: "不确定", ja: "わかりません" },
} as const;

type BehaviorTypeKey = "steady" | "guarded" | "boundary" | "social" | "explorer" | "spark";

const funnelCopy: Record<Lang, {
  nav: [string, string, string];
  quizKicker: string; quizTitle: string; quizHint: string; quizCorrect: string; quizWrong: string; quizExplain: string; quizCta: string;
  promise: string; traitBadge: string; progress: string; resultLabel: string; strengthLabel: string; watchLabel: string; prescriptionTitle: string; prescriptionLead: string;
  toolkitTitle: string; toolkitLead: string; environmentTitle: string; environmentBody: string; stickerTitle: string; stickerBody: string; alternativeTitle: string; alternativeBody: string;
  stickerNote: string; diaryCta: string; reset: string; source: string; safety: string;
}> = {
  ko: {
    nav: ["기질 홈", "기질체크", "7일 기록"], quizKicker: "10초 멍멍 O/X 퀴즈", quizTitle: "같은 견종이면\n성격도 거의 같을까요?", quizHint: "가볍게 찍어보세요. 정답은 바로 공개됩니다.", quizCorrect: "정답이에요! X", quizWrong: "아쉽지만 정답은 X예요", quizExplain: "견종은 힌트일 뿐, 실제 성격은 경험·환경·현재 감정에 따라 달라집니다.", quizCta: "우리 아이 기질 확인하기",
    promise: "15가지 일상 반응으로 우리 아이에게 가까운 기질 특성을 살펴보세요.", traitBadge: "3분 · 우리 아이 기질체크", progress: "응답 완료", resultLabel: "우리 아이 기질 체크 결과", strengthLabel: "잘하는 점", watchLabel: "이럴 땐 조금 더 봐주세요", prescriptionTitle: "오늘부터 이렇게 해보세요", prescriptionLead: "혼내기보다 상황을 바꾸고, 좋은 선택을 바로 알려주는 순서입니다.",
    toolkitTitle: "물어뜯기 처방 세트", toolkitLead: "한 가지만 쓰기보다 세 가지를 함께 적용하면 이해가 쉬워집니다.", environmentTitle: "① 접근 환경 바꾸기", environmentBody: "{when}에는 {target} 주변을 먼저 정리하고 접근 범위를 줄여주세요.", stickerTitle: "③ 쓴맛 스티커로 경계 만들기", stickerBody: "비터케어 쓴맛 스티커를 {target}의 금지 표면에 넓게 밀착해 선택의 경계를 알려주세요.", alternativeTitle: "② 씹어도 되는 것 연결하기", alternativeBody: "바로 옆에 비슷한 촉감의 안전한 씹기 대상을 두고 선택하면 즉시 칭찬해주세요.",
    stickerNote: "쓴맛 스티커는 보조 도구입니다. 강아지에게 직접 맛보게 하지 말고, 끝이 들뜨지 않도록 부착해주세요.", diaryCta: "이 결과로 변화 기록하기", reset: "다시 체크하기", source: "공개된 행동 연구를 참고해 일상 장면으로 독립 구성한 보호자용 관찰 결과", safety: "갑작스러운 공격성, 통증 반응, 이물 섭취가 있다면 행동문제가 아닌 건강 신호일 수 있습니다.",
  },
  en: {
    nav: ["Temperament", "Check", "7-day log"], quizKicker: "10-SECOND OX QUIZ", quizTitle: "Do dogs of the same breed\nhave almost the same personality?", quizHint: "Take a quick guess. The answer appears instantly.", quizCorrect: "Correct! It’s X", quizWrong: "Close — the answer is X", quizExplain: "Breed is only a clue. Experience, environment and current emotion shape each dog.", quizCta: "Check my dog’s temperament",
    promise: "Use 15 everyday reactions to explore the temperament traits closest to your dog.", traitBadge: "3 MIN · TEMPERAMENT CHECK", progress: "answered", resultLabel: "YOUR DOG’S TEMPERAMENT CHECK RESULT", strengthLabel: "Strong point", watchLabel: "Watch a little more", prescriptionTitle: "Try this from today", prescriptionLead: "Change the situation first, then make the good choice easy and rewarding.",
    toolkitTitle: "Chewing action kit", toolkitLead: "These three steps work better together than as one isolated fix.", environmentTitle: "① Change access", environmentBody: "At the likely moment ({when}), clear the area around {target} and reduce access first.", stickerTitle: "③ Mark the boundary with bitter stickers", stickerBody: "Attach BitterCare bitter stickers flat and wide on the forbidden surface of {target}.", alternativeTitle: "② Connect an approved chew", alternativeBody: "Place a safe chew with a similar texture nearby and praise the choice immediately.",
    stickerNote: "Bitter stickers are a support tool. Never make your dog taste one directly, and leave no loose edges.", diaryCta: "Track changes for this result", reset: "Check again", source: "An independently written guardian observation result informed by published canine behavior research", safety: "Sudden aggression, pain responses or swallowing objects can signal a health issue rather than a training problem.",
  },
  zh: {
    nav: ["气质首页", "气质测试", "7天记录"], quizKicker: "10秒 OX 小测验", quizTitle: "同一犬种的狗狗，\n性格也几乎一样吗？", quizHint: "轻松选一个，答案马上揭晓。", quizCorrect: "答对了！是 X", quizWrong: "差一点，正确答案是 X", quizExplain: "犬种只是线索，经历、环境和当下情绪会塑造每只狗狗。", quizCta: "查看我家狗狗的气质",
    promise: "通过15种日常反应，了解更接近爱犬的气质特征。", traitBadge: "3分钟 · 爱犬气质测试", progress: "已回答", resultLabel: "爱犬气质测试结果", strengthLabel: "擅长的地方", watchLabel: "这些时候多观察", prescriptionTitle: "从今天开始这样做", prescriptionLead: "先改变情境，再让正确选择变得简单并及时奖励。",
    toolkitTitle: "啃咬处方组合", toolkitLead: "三步一起使用，比只依赖一种方法更容易理解。", environmentTitle: "① 调整接触环境", environmentBody: "在{when}，先整理{target}周围并减少接触。", stickerTitle: "③ 用苦味贴建立边界", stickerBody: "将BitterCare苦味贴平整、宽幅地贴在{target}的禁咬表面。", alternativeTitle: "② 连接可啃咬物", alternativeBody: "旁边放置触感相近的安全啃咬物，选对时立即表扬。",
    stickerNote: "苦味贴是辅助工具。不要让狗狗直接品尝，贴合时不要留下翘边。", diaryCta: "按此结果记录变化", reset: "重新测试", source: "参考公开犬类行为研究、以日常情境独立编写的家长观察结果", safety: "突然出现攻击、疼痛反应或吞食异物，可能是健康信号而非训练问题。",
  },
  ja: {
    nav: ["気質ホーム", "気質チェック", "7日記録"], quizKicker: "10秒 OX クイズ", quizTitle: "同じ犬種なら、\n性格もほぼ同じでしょうか？", quizHint: "気軽に選んでください。答えはすぐに出ます。", quizCorrect: "正解！Xです", quizWrong: "惜しい、正解はXです", quizExplain: "犬種はヒントの一つ。経験・環境・今の感情で一頭ずつ変わります。", quizCta: "うちの子の気質をチェック",
    promise: "15の日常反応から、愛犬に近い気質の特徴を確認します。", traitBadge: "3分 · 愛犬の気質チェック", progress: "回答済み", resultLabel: "うちの子の気質チェック結果", strengthLabel: "得意なところ", watchLabel: "こんな時は少し観察", prescriptionTitle: "今日からこうしてみましょう", prescriptionLead: "叱る前に状況を変え、良い選択を簡単にしてすぐ褒める順番です。",
    toolkitTitle: "噛みつき対策セット", toolkitLead: "一つだけより、3つを一緒に使うと伝わりやすくなります。", environmentTitle: "① 近づく環境を変える", environmentBody: "{when}には、まず{target}の周りを片づけて接近を減らします。", stickerTitle: "③ 苦味ステッカーで境界を作る", stickerBody: "BitterCare苦味ステッカーを{target}の禁止面に広く平らに貼ります。", alternativeTitle: "② 噛んでよい物につなげる", alternativeBody: "似た感触の安全な噛む物をそばに置き、選べたらすぐ褒めます。",
    stickerNote: "苦味ステッカーは補助ツールです。直接味見させず、端が浮かないように貼ってください。", diaryCta: "この結果で変化を記録する", reset: "もう一度チェック", source: "公開された犬の行動研究を参考に、日常場面として独自に作成した観察結果", safety: "突然の攻撃性、痛み反応、異物を飲み込む行動は健康上のサインかもしれません。",
  },
};

const navigationCopy: Record<Lang, {
  labels: [string, string, string, string]; previous: string; next: string; anotherQuiz: string;
  quizGo: string; quizContinue: string; gateBadge: string; gateTitle: string; gateBody: string; gateChew: string; gateStart: string;
}> = {
  ko: { labels: ["처음으로", "우리 아이\n기질 체크", "멍멍\nO/X 퀴즈", "비터케어 3일 기록"], previous: "이전", next: "다음", anotherQuiz: "다른 O/X 문제 풀기", quizGo: "멍멍 O/X 퀴즈 시작하기", quizContinue: "물어뜯기 성향체크", gateBadge: "BITTERCARE · 3 DAY LOG", gateTitle: "비터케어를 사용하고 계신가요?", gateBody: "같은 부위를 3일 동안 사진으로 남겨 사용 전후의 변화를 비교해보세요.", gateChew: "물어뜯기 특성 먼저 확인하기", gateStart: "변화 관찰 기록 시작하기" },
  en: { labels: ["Start", "My dog\ntemperament", "Woof\nO/X quiz", "BitterCare 3-day log"], previous: "Back", next: "Next", anotherQuiz: "Try another O/X question", quizGo: "Start the Woof O/X quiz", quizContinue: "Next: check chewing patterns", gateBadge: "BITTERCARE · 3 DAY LOG", gateTitle: "Are you using BitterCare?", gateBody: "Photograph the same spot for three days to compare the change before and after use.", gateChew: "Check chewing pattern first", gateStart: "Start change log" },
  zh: { labels: ["首页", "爱犬\n气质测试", "汪汪\nO/X小测验", "BitterCare 3天记录"], previous: "返回", next: "下一步", anotherQuiz: "再做一道O/X题", quizGo: "开始汪汪O/X小测验", quizContinue: "下一步：确认啃咬特征", gateBadge: "BITTERCARE · 3天记录", gateTitle: "正在使用BitterCare吗？", gateBody: "连续3天拍摄同一位置，对比使用前后的变化。", gateChew: "先确认啃咬特征", gateStart: "开始变化观察记录" },
  ja: { labels: ["最初へ", "愛犬の\n気質チェック", "わんわん\nO/Xクイズ", "BitterCare 3日記録"], previous: "戻る", next: "次へ", anotherQuiz: "別のO/X問題に挑戦", quizGo: "わんわんO/Xクイズを始める", quizContinue: "次へ：噛み癖の特徴を確認", gateBadge: "BITTERCARE · 3日記録", gateTitle: "BitterCareを使用中ですか？", gateBody: "同じ場所を3日間撮影し、使用前後の変化を比べましょう。", gateChew: "先に噛み癖を確認", gateStart: "変化の観察記録を始める" },
};

const chewCtaCopy: Record<Lang, string> = {
  ko: "물어뜯기 특성 확인하기",
  en: "Check chewing pattern",
  zh: "确认啃咬特征",
  ja: "噛み癖の特徴を確認",
};

const chewNavCopy: Record<Lang, string> = {
  ko: "물어뜯기\n성향 체크",
  en: "Chewing pattern",
  zh: "啃咬特征",
  ja: "噛み癖チェック",
};

const diaryAfterChewCopy: Record<Lang, string> = {
  ko: "비터케어 사용 후 3일 변화 확인하기",
  en: "Track 3 days after using BitterCare",
  zh: "使用BitterCare后记录3天变化",
  ja: "BitterCare使用後の3日間を記録",
};

const bottomBitterCareCopy: Record<Lang, { prefix: string; brand: string }> = {
  ko: { prefix: "물어뜯기 습관엔", brand: "비터케어" },
  en: { prefix: "For chewing habits,", brand: "BitterCare" },
  zh: { prefix: "啃咬习惯，用", brand: "BitterCare" },
  ja: { prefix: "噛み癖には", brand: "BitterCare" },
};

const researchReferenceNote: Record<Lang, string> = {
  ko: "C-BARQ·Darwin’s Ark 등 공개된 반려견 행동 연구자료를 참고했습니다. 본 기질 체크는 일상 관찰을 돕기 위해 독립적으로 구성했으며, 공식 검사나 진단 도구가 아닙니다.",
  en: "Public canine behavior research, including C-BARQ and Darwin’s Ark, was reviewed. This independently written check supports everyday observation and is not an official assessment or diagnostic tool.",
  zh: "参考了C-BARQ、Darwin’s Ark等公开犬类行为研究。本气质测试为帮助日常观察而独立编写，并非官方评估或诊断工具。",
  ja: "C-BARQやDarwin’s Arkなど公開された犬の行動研究を参考にしました。本チェックは日常観察を助けるために独自作成したもので、公式検査や診断ツールではありません。",
};

const photoChallengeCopy: Record<Lang, {
  badge: string; title: string; body: string; days: [string, string, string]; tip: string; cta: string;
  uploadTips: [string, string, string]; ready: string;
}> = {
  ko: {
    badge: "PHOTO CHALLENGE · 3 DAYS",
    title: "사진 3장으로\n변화를 확인해보세요",
    body: "같은 물어뜯기 부위를 하루 한 번 찍으면 기억보다 정확하게 변화를 비교할 수 있어요.",
    days: ["1일차\n사용 전", "2일차\n반응 관찰", "3일차\n전후 비교"],
    tip: "📸 같은 위치와 각도로 찍을수록 비교가 쉬워요",
    cta: "비터케어 변화 관찰하기",
    uploadTips: ["📍 같은 위치", "📐 같은 각도", "☀️ 비슷한 밝기"],
    ready: "오늘의 사진이 준비됐어요!",
  },
  en: {
    badge: "PHOTO CHALLENGE · 3 DAYS", title: "See the change\nin just 3 photos", body: "One photo a day of the same chewing spot makes change easier to compare than memory alone.",
    days: ["DAY 1\nBefore", "DAY 2\nObserve", "DAY 3\nCompare"], tip: "📸 Use the same spot and angle for a clearer comparison", cta: "Observe the BitterCare change",
    uploadTips: ["📍 Same spot", "📐 Same angle", "☀️ Similar light"], ready: "Today’s photo is ready!",
  },
  zh: {
    badge: "照片挑战 · 3天", title: "用3张照片\n看见变化", body: "每天拍一次相同的啃咬位置，比只凭记忆更容易比较变化。",
    days: ["第1天\n使用前", "第2天\n观察反应", "第3天\n前后比较"], tip: "📸 相同位置和角度更容易比较", cta: "观察BitterCare使用变化",
    uploadTips: ["📍 相同位置", "📐 相同角度", "☀️ 相似光线"], ready: "今天的照片已准备好！",
  },
  ja: {
    badge: "PHOTO CHALLENGE · 3 DAYS", title: "3枚の写真で\n変化を確認", body: "同じ噛み跡を1日1回撮ると、記憶だけより変化を比べやすくなります。",
    days: ["1日目\n使用前", "2日目\n反応観察", "3日目\n前後比較"], tip: "📸 同じ場所・角度で撮ると比べやすいです", cta: "BitterCareの変化を観察する",
    uploadTips: ["📍 同じ場所", "📐 同じ角度", "☀️ 近い明るさ"], ready: "今日の写真を準備できました！",
  },
};

const threeDayCopy: Record<Lang, {
  navLabel: string; gateBadge: string; gateBody: string; header: string; hero: string; introTitle: string; introDesc: string;
  progress: string; days: [string, string, string][]; compareTitle: string; compareLead: string; compareRequired: string;
  compareOptions: [string, string][];
}> = {
  ko: { navLabel: "비터케어 3일 기록", gateBadge: "BITTERCARE · 3 DAY LOG", gateBody: "물어뜯기 특성을 먼저 확인한 뒤, 같은 부위를 3일 동안 사진으로 남겨 전후 변화를 한눈에 비교해보세요.", header: "비터케어 3일 기록", hero: "사진 한 장씩,\n딱 3일만!", introTitle: "같은 곳을 찰칵 📸", introDesc: "1일차와 3일차를 같은 각도로 찍으면 변화가 한눈에 보여요.", progress: "일 기록 완료", days: [["DAY 1", "사용 전 찰칵", "물어뜯는 위치와 기존 흔적이 함께 보이게 찍어주세요."], ["DAY 2", "반응 한 줄", "다가감·탐색·회피 중 보인 반응을 짧게 남겨주세요."], ["DAY 3", "첫날과 나란히", "같은 위치를 다시 찍고 물어뜯기 변화를 골라주세요."]], compareTitle: "첫째 날과 비교해 변화가 있었나요?", compareLead: "가장 가까운 답을 하나 선택해주세요.", compareRequired: "변화 정도를 선택하면 마지막 기록을 저장할 수 있습니다.", compareOptions: [["much", "많이 줄었어요"], ["little", "조금 줄었어요"], ["same", "비슷해요"], ["worse", "더 심해졌어요"]] },
  en: { navLabel: "BitterCare 3-day log", gateBadge: "BITTERCARE · 3 DAY LOG", gateBody: "Check the chewing pattern first, then record changes before and after BitterCare for three days.", header: "BitterCare 3-day log", hero: "Once a day,\nfor just 3 days.", introTitle: "Three days in photos", introDesc: "Photograph Day 1 and Day 3 from the same angle for a clearer comparison.", progress: "days completed", days: [["DAY 1", "Before use", "Photograph the protected area and existing damage."], ["DAY 2", "Observe response", "Note approach, exploration, avoidance and adhesion."], ["DAY 3", "Compare with Day 1", "Compare the photos and select the change in chewing behavior."]], compareTitle: "Has anything changed since Day 1?", compareLead: "Choose the answer that fits best.", compareRequired: "Choose a change level to save the final entry.", compareOptions: [["much", "Much less"], ["little", "A little less"], ["same", "About the same"], ["worse", "More frequent"]] },
  zh: { navLabel: "BitterCare 3天记录", gateBadge: "BITTERCARE · 3天记录", gateBody: "先确认啃咬特征，再连续3天用照片和文字记录使用前后的变化。", header: "BitterCare 3天记录", hero: "每天一次，\n只记录3天。", introTitle: "用照片比较3天", introDesc: "第1天和第3天从相同角度拍摄，更容易看出变化。", progress: "天已完成", days: [["第1天", "使用前", "拍摄保护位置和原有啃咬痕迹。"], ["第2天", "观察反应", "记录接近、探索、回避和贴合状态。"], ["第3天", "与第1天比较", "比较照片并选择啃咬行为的变化。"]], compareTitle: "与第1天相比有变化吗？", compareLead: "请选择最接近的一项。", compareRequired: "选择变化程度后即可保存最后记录。", compareOptions: [["much", "明显减少"], ["little", "稍有减少"], ["same", "基本相同"], ["worse", "更加严重"]] },
  ja: { navLabel: "BitterCare 3日記録", gateBadge: "BITTERCARE · 3日記録", gateBody: "まず噛み癖を確認し、BitterCare使用前後の変化を3日間、写真とメモで記録しましょう。", header: "BitterCare 3日記録", hero: "1日1回、\n3日だけ記録。", introTitle: "写真で比べる3日間", introDesc: "1日目と3日目を同じ角度で撮ると変化を確認しやすくなります。", progress: "日記録完了", days: [["DAY 1", "使用前", "保護する場所と噛み跡を撮影します。"], ["DAY 2", "反応を観察", "接近・探索・回避と密着状態を記録します。"], ["DAY 3", "1日目と比較", "写真を比較し、噛む行動の変化を選びます。"]], compareTitle: "1日目と比べて変化はありましたか？", compareLead: "最も近い回答を選んでください。", compareRequired: "変化を選ぶと最後の記録を保存できます。", compareOptions: [["much", "大きく減った"], ["little", "少し減った"], ["same", "ほぼ同じ"], ["worse", "増えた"]] },
};

const observationCopy: Record<Lang, {
  required: string;
  approach: [string, [string, string][]];
  chewed: [string, [string, string][]];
  reaction: [string, [string, string][]];
  adhesion: [string, [string, string][]];
  report: string; help: string; helpDone: string; extend: string; reapply: string;
  reportLabels: [string, string, string, string];
}> = {
  ko: {
    required: "사진과 네 가지 반응을 모두 남기면 오늘 기록을 저장할 수 있어요.",
    approach: ["오늘 몇 번 다가갔나요?", [["0", "0회"], ["1-2", "1~2회"], ["3-5", "3~5회"], ["6+", "6회 이상"]]],
    chewed: ["실제로 물어뜯었나요?", [["no", "안 했어요"], ["try", "시도만 했어요"], ["yes", "물어뜯었어요"]]],
    reaction: ["쓴맛을 느낀 뒤 반응은 어땠나요?", [["avoid", "바로 피했어요"], ["pause", "멈칫했어요"], ["weak", "반응이 약했어요"], ["none", "반응이 없었어요"]]],
    adhesion: ["스티커 부착 상태는 어떤가요?", [["good", "잘 붙어 있어요"], ["edge", "끝이 조금 떴어요"], ["loose", "많이 들떴어요"]]],
    report: "3일 자동 리포트", help: "비터케어 도움 요청", helpDone: "도움 요청이 전달됐어요", extend: "2~3일 더 관찰하기", reapply: "부착 방법 다시 확인하기", reportLabels: ["접근", "물어뜯기", "쓴맛 반응", "부착 상태"],
  },
  en: {
    required: "Add a photo and all four observations to save today’s log.",
    approach: ["How often did your dog approach today?", [["0", "0"], ["1-2", "1–2"], ["3-5", "3–5"], ["6+", "6+"]]],
    chewed: ["Did your dog actually chew?", [["no", "No"], ["try", "Tried"], ["yes", "Yes"]]],
    reaction: ["Response after tasting bitter?", [["avoid", "Avoided"], ["pause", "Paused"], ["weak", "Weak"], ["none", "None"]]],
    adhesion: ["How is the sticker attached?", [["good", "Secure"], ["edge", "Edge lifted"], ["loose", "Loose"]]],
    report: "3-day automatic report", help: "Ask BitterCare for help", helpDone: "Your request was sent", extend: "Observe 2–3 more days", reapply: "Review application guide", reportLabels: ["Approach", "Chewing", "Bitter response", "Adhesion"],
  },
  zh: {
    required: "上传照片并完成四项观察后，即可保存今天的记录。",
    approach: ["今天接近了几次？", [["0", "0次"], ["1-2", "1~2次"], ["3-5", "3~5次"], ["6+", "6次以上"]]],
    chewed: ["实际啃咬了吗？", [["no", "没有"], ["try", "只是尝试"], ["yes", "啃咬了"]]],
    reaction: ["接触苦味后的反应？", [["avoid", "立即避开"], ["pause", "停顿"], ["weak", "反应较弱"], ["none", "无反应"]]],
    adhesion: ["贴纸粘贴状态？", [["good", "贴合良好"], ["edge", "边缘翘起"], ["loose", "明显松动"]]],
    report: "3天自动报告", help: "请求BitterCare帮助", helpDone: "帮助请求已发送", extend: "再观察2~3天", reapply: "重新查看粘贴方法", reportLabels: ["接近", "啃咬", "苦味反应", "粘贴状态"],
  },
  ja: {
    required: "写真と4つの反応をすべて記録すると保存できます。",
    approach: ["今日は何回近づきましたか？", [["0", "0回"], ["1-2", "1〜2回"], ["3-5", "3〜5回"], ["6+", "6回以上"]]],
    chewed: ["実際に噛みましたか？", [["no", "噛まない"], ["try", "試しただけ"], ["yes", "噛んだ"]]],
    reaction: ["苦味の後の反応は？", [["avoid", "すぐ避けた"], ["pause", "止まった"], ["weak", "弱い"], ["none", "なし"]]],
    adhesion: ["シールの密着状態は？", [["good", "良好"], ["edge", "端が浮いた"], ["loose", "大きく浮いた"]]],
    report: "3日自動レポート", help: "BitterCareに相談", helpDone: "相談内容を送信しました", extend: "あと2〜3日観察", reapply: "貼り方を確認", reportLabels: ["接近", "噛む行動", "苦味反応", "密着状態"],
  },
};

const productGuideCopy: Record<Lang, { learn: string; badge: string; title: string; body: string; points: [string, string, string]; videoTitle: string; videoHint: string; usage: string; usageHint: string; steps: [string, string][]; tipsTitle: string; tips: [string, string]; buyLead: string; buy: string; imageAlt: string }> = {
  ko: { learn: "비터케어 알아보기", badge: "BITTERCARE · HOW TO USE", title: "자꾸 물어뜯는 곳,\n비터케어로 보호하세요", body: "가구나 전선처럼 자주 물어뜯는 곳에 넓고 꼼꼼하게 붙여주세요. 강아지가 스스로 접촉하면서 쓴맛을 느끼고, 물어뜯지 않는 습관을 익히도록 도와줍니다.", points: ["직접 맛보이지 않기", "필요한 부위에 넓게 붙이기", "끝까지 눌러 들뜸 없애기"], videoTitle: "1분 안에 보는 비터케어 사용법", videoHint: "버튼을 누르지 않아도 바로 볼 수 있어요. 핵심 부착 방법을 영상으로 먼저 확인해보세요.", usage: "효과를 높이는 5가지 체크", usageHint: "각 단계의 이미지와 같은 내용으로 맞춰두었어요. 궁금한 단계만 눌러 확인하세요.", steps: [["직접 맛보이지 않기", "스티커를 입에 직접 대주지 마세요. 장난감처럼 인식해 이빨로 잡아당길 수 있어요."], ["쓴맛면 확인하기", "보호지를 제거한 뒤 인쇄된 쓴맛면이 강아지가 접촉하는 바깥쪽을 향하도록 붙여주세요."], ["필요한 부위에 넓게 붙이기", "물어뜯는 지점만 좁게 덮지 말고 주변까지 넓게 보호해 이빨로 잡을 틈을 줄여주세요."], ["들뜨지 않게 끝까지 밀착", "가장자리와 끝부분을 꾹 눌러 완전히 밀착하세요. 들뜬 틈이 있으면 스티커 자체를 뜯을 수 있어요."], ["전선은 돌돌 감아 붙이기", "전선처럼 좁고 긴 곳은 일직선으로 붙이기보다 겹치듯 돌돌 감아 들뜰 틈을 줄여주세요."]], tipsTitle: "사용 후 이것도 기억해주세요", tips: ["자연스럽게 접근할 때 쓴맛을 반복 경험하도록 해주세요. 억지로 직접 맛보이지는 마세요.", "로프·장난감처럼 씹어도 되는 대상을 가까이 두어 안전한 씹기 행동으로 연결해주세요."], buyLead: "우리 아이가 계속 같은 곳을 물어뜯는다면?", buy: "비터케어로 보호 시작하기", imageAlt: "비터케어 사용 가이드" },
  en: { learn: "Learn about BitterCare", badge: "BITTERCARE · HOW TO USE", title: "Protect the places\nyour dog keeps chewing", body: "Apply BitterCare widely and firmly to furniture, cables, or other frequently chewed areas. Natural contact with the bitter surface helps your dog learn to leave the area alone.", points: ["Never offer it directly", "Cover the needed area widely", "Press every edge flat"], videoTitle: "BitterCare use guide in under a minute", videoHint: "The video is shown right away so you can check the key application method first.", usage: "5 checks for better results", usageHint: "Each step now matches the guide image shown inside it. Open only the step you need.", steps: [["Do not offer it directly", "Do not put the sticker into your dog’s mouth. It may be treated like a toy and pulled with the teeth."], ["Check the bitter side", "Remove the backing and make sure the printed bitter surface faces outward where your dog can naturally contact it."], ["Cover the needed area widely", "Protect beyond the exact bite point so there is less exposed space or edge to grab."], ["Press every edge completely flat", "Press firmly along the edges and ends. A lifted edge can become something your dog tries to pull."], ["Wrap cables around, not in one strip", "For narrow cables, wrap the sticker around the cable with overlap instead of applying one straight strip."]], tipsTitle: "Also remember after applying", tips: ["Let bitter contact happen naturally and repeatedly when your dog approaches. Do not force tasting.", "Keep a safe rope or chew toy nearby and redirect chewing toward an appropriate option."], buyLead: "Does your dog keep returning to the same spot?", buy: "Start protecting with BitterCare", imageAlt: "BitterCare use guide" },
  zh: { learn: "了解BitterCare", badge: "BITTERCARE · 使用方法", title: "保护爱犬\n经常啃咬的位置", body: "请将BitterCare宽幅、平整地贴在家具、电线等经常被啃咬的位置。狗狗自然接触苦味表面后，有助于逐渐减少啃咬。", points: ["不要直接让狗狗品尝", "大面积覆盖需要保护的位置", "按压边缘避免翘起"], videoTitle: "1分钟内看懂BitterCare用法", videoHint: "无需额外点击，视频会直接显示，先快速确认核心粘贴方法。", usage: "提升效果的5项检查", usageHint: "每个步骤都与展开后显示的指南图片一一对应。", steps: [["不要直接让狗狗品尝", "不要把贴纸直接放进狗狗嘴里，否则可能把它当成玩具用牙齿拉扯。"], ["确认苦味面方向", "撕掉离型纸后，请让印有苦味成分的一面朝向狗狗自然接触的外侧。"], ["大面积覆盖需要保护的位置", "不要只覆盖一个小点，建议连同周围区域一起保护，减少可咬住的边缘。"], ["从边缘到末端充分压紧", "请把边缘和末端充分按压贴平，避免翘起后被狗狗抓住拉扯。"], ["电线请螺旋缠绕粘贴", "对于细长电线，不要只贴一条直线，建议重叠缠绕以减少翘起和可抓住的缝隙。"]], tipsTitle: "使用后也请记住", tips: ["让狗狗靠近时自然、重复地接触苦味，不要强迫直接品尝。", "在附近准备绳结玩具或磨牙玩具，把啃咬行为引导到安全对象上。"], buyLead: "如果爱犬总是反复啃咬同一个位置？", buy: "用BitterCare开始保护", imageAlt: "BitterCare使用指南" },
  ja: { learn: "BitterCareを知る", badge: "BITTERCARE · 使い方", title: "何度も噛む場所を\nBitterCareで守りましょう", body: "家具やコードなど、よく噛む場所に広く丁寧に貼ってください。自然に苦味の面へ触れることで、その場所を噛まない習慣づくりをサポートします。", points: ["直接味見させない", "必要な範囲に広く貼る", "端まで押して浮きをなくす"], videoTitle: "1分以内でわかるBitterCareの使い方", videoHint: "動画はそのまま表示されます。まずは正しい貼り方のポイントを確認してください。", usage: "効果を高める5つのチェック", usageHint: "各ステップは、開いたときに表示されるガイド画像と内容をそろえています。", steps: [["直接味見させない", "シールを口元に直接与えないでください。おもちゃのように認識して歯で引っ張ることがあります。"], ["苦味面を確認する", "剥離紙をはがし、印刷された苦味面が犬が自然に触れる外側を向くように貼ってください。"], ["必要な範囲に広く貼る", "噛んでいる一点だけでなく周辺まで広めに保護し、つかめる隙間を減らしてください。"], ["端まで浮かないよう密着", "端と末端までしっかり押して密着させてください。浮いた部分は引っ張るきっかけになります。"], ["コードはらせん状に巻く", "細いコードは一直線に貼らず、少し重ねながら巻き付けて浮きやつかめる隙間を減らしてください。"]], tipsTitle: "使用後はこちらも忘れずに", tips: ["近づいたときに自然な苦味経験を繰り返せるようにし、無理に味見させないでください。", "ロープやおもちゃなど安全に噛めるものを近くに置き、適切な噛み行動へつなげてください。"], buyLead: "同じ場所を何度も噛んでしまうなら？", buy: "BitterCareで保護を始める", imageAlt: "BitterCare使用ガイド" },
};

const storePickerCopy: Record<Lang, { eyebrow: string; title: string; lead: string; coupang: string; smartStore: string; close: string }> = {
  ko: { eyebrow: "SHOP BITTERCARE", title: "구매처를 선택해 주세요", lead: "편한 구매처를 선택해 주세요.", coupang: "쿠팡에서 구매하기", smartStore: "네이버 스마트스토어에서 구매하기", close: "구매처 선택 닫기" },
  en: { eyebrow: "SHOP BITTERCARE", title: "Choose a store", lead: "Choose the store that works best for you.", coupang: "Buy on Coupang", smartStore: "Buy on Naver Smart Store", close: "Close store selection" },
  zh: { eyebrow: "购买 BITTERCARE", title: "请选择购买平台", lead: "请选择您方便使用的购买平台。", coupang: "前往 Coupang 购买", smartStore: "前往 Naver Smart Store 购买", close: "关闭购买平台选择" },
  ja: { eyebrow: "SHOP BITTERCARE", title: "購入先を選んでください", lead: "使いやすい購入先をお選びください。", coupang: "Coupangで購入", smartStore: "Naver Smart Storeで購入", close: "購入先の選択を閉じる" },
};

const nextStepCopy: Record<Lang, { badge: string; title: string; body: string; cta: string; quizBadge: string }> = {
  ko: { badge: "NEXT STEP", title: "우리 아이가 물어뜯는 행동도 있나요?", body: "물어뜯는 이유를 알아보면 대처 방법도 달라질 수 있어요.", cta: "물어뜯기 성향 체크하기", quizBadge: "가볍게 쉬어가기" },
  en: { badge: "NEXT STEP", title: "Does your dog chew things too?", body: "Understanding the reason can change the way you respond.", cta: "Check chewing pattern", quizBadge: "A quick break" },
  zh: { badge: "下一步", title: "爱犬也有啃咬行为吗？", body: "了解啃咬原因后，应对方法也会有所不同。", cta: "开始啃咬特征测试", quizBadge: "轻松休息一下" },
  ja: { badge: "NEXT STEP", title: "愛犬にも噛み癖がありますか？", body: "噛む理由がわかると、対応方法も変わります。", cta: "噛み癖チェックを始める", quizBadge: "ひと休みコンテンツ" },
};

const programGateChoiceCopy: Record<Lang, { using: string; before: string; chew: string }> = {
  ko: { using: "네, 사용 중이에요", before: "아직 사용 전이에요", chew: "우리 아이 물어뜯기 유형부터 알아보기" },
  en: { using: "Yes, we are using it", before: "Not using it yet", chew: "Check my dog’s chewing type first" },
  zh: { using: "是的，正在使用", before: "还未开始使用", chew: "先了解爱犬的啃咬类型" },
  ja: { using: "はい、使用中です", before: "まだ使用前です", chew: "先に愛犬の噛み癖タイプを確認" },
};

const extraObservationCopy: Record<Lang, [string, string]> = {
  ko: ["조금 더 관찰", "같은 항목을 기록해 변화가 이어지는지 확인해주세요."],
  en: ["Extra observation", "Use the same observations to see whether the change continues."],
  zh: ["继续观察", "记录相同项目，确认变化是否持续。"],
  ja: ["もう少し観察", "同じ項目を記録して、変化が続くか確認してください。"],
};

const behaviorTypes: Record<Lang, Record<BehaviorTypeKey, { emoji: string; name: string; hook: string; description: string; strength: string; watch: string; actions: [string, string][] }>> = {
  ko: {
    steady: { emoji: "🌿", name: "안정 회복형", hook: "흔들려도 제자리로 돌아오는 아이", description: "낯선 상황을 살핀 뒤 비교적 빠르게 일상으로 돌아오는 편입니다.", strength: "회복력과 균형감", watch: "평소와 다른 반응이 갑자기 길어질 때", actions: [["좋은 기준 유지", "익숙한 산책·휴식 리듬을 꾸준히 지켜주세요."], ["작은 변화 기록", "평소와 다른 반응이 2~3일 이어지는지 메모해주세요."], ["두뇌 놀이 더하기", "짧은 냄새찾기와 안전한 씹기 활동을 번갈아 주세요."]] },
    guarded: { emoji: "📡", name: "경계 레이더형", hook: "먼저 살피고 안전을 확인하는 아이", description: "낯선 사람이나 갑작스러운 접근을 빠르게 감지하는 편입니다.", strength: "섬세한 관찰력", watch: "피할 공간 없이 인사를 강요받을 때", actions: [["거리부터 확보", "반응이 시작되기 전 편안한 거리로 이동해주세요."], ["보호자 보기 연습", "낯선 대상을 본 뒤 보호자를 보면 바로 보상해주세요."], ["안전지대 만들기", "손님이 올 때 쉴 수 있는 고정된 자리를 준비해주세요."]] },
    boundary: { emoji: "🫧", name: "거리 존중형", hook: "내 몸의 선택권이 중요한 아이", description: "만지거나 제지하는 상황에서 불편함을 비교적 분명하게 표현합니다.", strength: "명확한 의사표현", watch: "갑작스러운 안기·빼앗기·몸 고정", actions: [["동의 신호 만들기", "손을 가까이한 뒤 스스로 다가올 때만 천천히 만져주세요."], ["빼앗지 말고 교환", "물건을 억지로 빼기보다 더 좋은 보상과 바꿔주세요."], ["한 단계씩 적응", "발·귀·입 주변 관리는 1초 접촉부터 짧게 시작해주세요."]] },
    social: { emoji: "🧲", name: "관계 반응형", hook: "다른 강아지에 마음이 크게 움직이는 아이", description: "다른 개를 보았을 때 흥분하거나 긴장하는 반응이 두드러집니다.", strength: "높은 사회적 관심", watch: "좁은 길에서 정면으로 가까워질 때", actions: [["동선 바꾸기", "마주치기 전에 길을 건너거나 곡선으로 지나가세요."], ["바닥 냄새 찾기", "간식을 흩뿌려 시선을 자연스럽게 아래로 전환해주세요."], ["차분한 확인 보상", "다른 개를 보고도 보호자를 확인하면 즉시 칭찬해주세요."]] },
    explorer: { emoji: "🔎", name: "조심 탐색형", hook: "천천히 알아가야 용기가 생기는 아이", description: "새 장소·소리·물건을 충분히 확인해야 편안해지는 편입니다.", strength: "신중한 판단력", watch: "피할 수 없는 빠른 노출이 반복될 때", actions: [["작게 보여주기", "새 자극은 멀리서 짧게 경험하고 바로 쉬게 해주세요."], ["선택권 주기", "다가가거나 물러날 수 있는 여유 줄을 확보해주세요."], ["예고 가능한 하루", "산책·식사·휴식 시간을 가능한 일정하게 유지해주세요."]] },
    spark: { emoji: "⚡", name: "빠른 점화형", hook: "즐거움도 긴장도 빠르게 커지는 아이", description: "자극을 받으면 흥분이 빠르게 올라가고 진정까지 시간이 필요한 편입니다.", strength: "풍부한 에너지와 몰입", watch: "놀이가 길어져 스스로 멈추기 어려울 때", actions: [["자극 전 냄새놀이", "흥분하기 쉬운 시간 5분 전에 간단한 냄새찾기를 해주세요."], ["짧게 놀고 멈추기", "놀이를 3~5분 단위로 끊고 물과 휴식을 연결해주세요."], ["진정 루틴 고정", "조명을 낮추고 매트에서 씹는 순서를 매일 반복해주세요."]] },
  },
  en: {} as Record<BehaviorTypeKey, never>, zh: {} as Record<BehaviorTypeKey, never>, ja: {} as Record<BehaviorTypeKey, never>,
};

const translatedTypeCore: Record<Exclude<Lang, "ko">, Record<BehaviorTypeKey, { name: string; hook: string; description: string; strength: string; watch: string; actions: [string, string][] }>> = {
  en: {
    steady: { name: "Steady Recoverer", hook: "Bounces back after a wobble", description: "Usually observes change and returns to routine relatively quickly.", strength: "Balance and recovery", watch: "A new reaction suddenly lasts longer", actions: [["Keep the good baseline", "Maintain familiar walk and rest rhythms."], ["Log small changes", "Note whether an unusual response continues for 2–3 days."], ["Add brain play", "Alternate short scent games with safe chewing."]] },
    guarded: { name: "Guarded Scanner", hook: "Checks safety before joining in", description: "Notices strangers and sudden approaches quickly.", strength: "Sensitive observation", watch: "Greetings are forced without an escape route", actions: [["Create distance first", "Move to a comfortable distance before the reaction grows."], ["Practice check-ins", "Reward looking back at you after noticing a stranger."], ["Build a safe zone", "Prepare a fixed resting place when visitors arrive."]] },
    boundary: { name: "Boundary Keeper", hook: "Needs a say about body contact", description: "Expresses discomfort clearly during touch or restraint.", strength: "Clear communication", watch: "Sudden holding, grabbing or forced handling", actions: [["Create a consent cue", "Pause near the body and touch only when your dog approaches."], ["Trade, don’t grab", "Exchange an object for a better reward instead of forcing it away."], ["Go one step at a time", "Start paw, ear and mouth care with one-second touches."]] },
    social: { name: "Social Reactor", hook: "Other dogs move big feelings", description: "Excitement or tension is strongest around other dogs.", strength: "Strong social interest", watch: "Head-on approaches on narrow paths", actions: [["Change the route", "Cross early or pass in a curve."], ["Scatter and sniff", "Scatter treats to shift attention naturally downward."], ["Reward calm check-ins", "Praise any glance back at you after seeing a dog."]] },
    explorer: { name: "Careful Explorer", hook: "Courage grows at their own pace", description: "Needs time to inspect new places, sounds and objects.", strength: "Thoughtful judgment", watch: "Fast exposure without an escape choice", actions: [["Show it small", "Meet new stimuli briefly from farther away, then rest."], ["Offer a choice", "Keep enough leash space to approach or retreat."], ["Keep days predictable", "Use a consistent rhythm for walks, meals and rest."]] },
    spark: { name: "Quick Spark", hook: "Joy and tension rise fast", description: "Arousal climbs quickly and can take time to settle.", strength: "Energy and focus", watch: "Play continues past the ability to stop", actions: [["Sniff before the trigger", "Do a simple scent search five minutes before busy times."], ["Play in short rounds", "Pause every 3–5 minutes for water and rest."], ["Fix a cool-down routine", "Repeat dim lights, mat and calm chewing in the same order."]] },
  },
  zh: {
    steady: { name: "稳定恢复型", hook: "波动后能回到自己的节奏", description: "观察变化后通常能较快恢复日常状态。", strength: "平衡与恢复力", watch: "异常反应突然持续更久", actions: [["保持良好基线", "维持熟悉的散步与休息节奏。"], ["记录细小变化", "观察异常反应是否持续2–3天。"], ["增加动脑游戏", "轮换短时嗅闻游戏与安全啃咬。"]] },
    guarded: { name: "警戒雷达型", hook: "先确认安全再靠近", description: "会很快察觉陌生人和突然接近。", strength: "敏锐观察力", watch: "没有退路却被迫打招呼", actions: [["先拉开距离", "在反应升级前移到舒适距离。"], ["练习看家长", "看到陌生目标后回看您时立即奖励。"], ["建立安全区", "来客时准备固定休息位置。"]] },
    boundary: { name: "边界尊重型", hook: "身体接触需要自己选择", description: "在触摸或限制时会清楚表达不适。", strength: "明确沟通", watch: "突然抱起、抢夺或固定身体", actions: [["建立同意信号", "靠近后暂停，只在狗狗主动时触摸。"], ["交换而非抢走", "用更好的奖励交换物品。"], ["逐步适应", "从1秒触碰爪、耳、嘴开始。"]] },
    social: { name: "社交反应型", hook: "其他狗狗会带来强烈情绪", description: "见到其他狗时兴奋或紧张反应更明显。", strength: "高度社交关注", watch: "狭窄道路上正面接近", actions: [["改变路线", "提前过街或走弧线通过。"], ["撒食嗅闻", "撒下零食自然把视线引向地面。"], ["奖励冷静确认", "看到狗后回看您时立即表扬。"]] },
    explorer: { name: "谨慎探索型", hook: "按自己的速度建立勇气", description: "需要时间确认新地点、声音和物品。", strength: "谨慎判断", watch: "没有退路的快速暴露", actions: [["小范围展示", "从远处短暂体验新刺激后休息。"], ["给予选择", "留出可以靠近或后退的牵引空间。"], ["保持可预测", "尽量固定散步、进食和休息节奏。"]] },
    spark: { name: "快速点燃型", hook: "快乐与紧张都会迅速放大", description: "刺激后兴奋上升很快，平静需要时间。", strength: "充沛精力与专注", watch: "游戏过长而无法自己停下", actions: [["刺激前嗅闻", "高兴奋时段前5分钟做简单找味游戏。"], ["短回合玩耍", "每3–5分钟暂停喝水和休息。"], ["固定冷静流程", "每天重复调暗灯光、上垫子、安静啃咬。"]] },
  },
  ja: {
    steady: { name: "安定リカバリー型", hook: "揺れても自分のペースに戻れる子", description: "変化を確認したあと比較的早く日常に戻れます。", strength: "バランスと回復力", watch: "いつもと違う反応が長引く時", actions: [["良い基準を保つ", "慣れた散歩と休息のリズムを守ります。"], ["小さな変化を記録", "違う反応が2〜3日続くか確認します。"], ["頭を使う遊び", "短いにおい探しと安全な噛む遊びを交互に。"]] },
    guarded: { name: "警戒レーダー型", hook: "安全を確認してから近づく子", description: "知らない人や急な接近に素早く気づきます。", strength: "繊細な観察力", watch: "逃げ場なく挨拶を強いられる時", actions: [["まず距離を取る", "反応が大きくなる前に安心できる距離へ。"], ["飼い主を見る練習", "対象を見た後こちらを見たらすぐ褒めます。"], ["安全地帯を作る", "来客時に休める定位置を用意します。"]] },
    boundary: { name: "距離尊重型", hook: "体に触れる選択権が大切な子", description: "触れられたり制止された時の不快感を明確に示します。", strength: "明確な意思表示", watch: "急に抱く・奪う・体を固定する時", actions: [["同意の合図", "手を近づけて待ち、自分から来た時だけ触れます。"], ["奪わず交換", "より良い報酬と交換します。"], ["一段ずつ慣らす", "足・耳・口のケアは1秒の接触から。"]] },
    social: { name: "関係リアクター型", hook: "他の犬で気持ちが大きく動く子", description: "他の犬を見た時の興奮や緊張が目立ちます。", strength: "高い社会的関心", watch: "狭い道で正面から近づく時", actions: [["ルートを変える", "早めに渡るかカーブして通ります。"], ["床でにおい探し", "おやつを散らして自然に視線を下へ。"], ["落ち着いた確認を褒める", "犬を見てこちらを確認したらすぐ褒めます。"]] },
    explorer: { name: "慎重な探検型", hook: "自分の速さで勇気が育つ子", description: "新しい場所・音・物を確認する時間が必要です。", strength: "慎重な判断力", watch: "逃げられない速い刺激が続く時", actions: [["小さく見せる", "遠くから短く経験して休ませます。"], ["選択肢を与える", "近づく・離れる余裕を作ります。"], ["予測できる一日", "散歩・食事・休息を一定にします。"]] },
    spark: { name: "クイックスパーク型", hook: "楽しさも緊張もすぐ大きくなる子", description: "刺激で興奮が早く上がり、落ち着くまで時間が必要です。", strength: "豊かなエネルギーと集中", watch: "遊びが長くなり自分で止めにくい時", actions: [["刺激前ににおい遊び", "興奮しやすい時間の5分前に行います。"], ["短く遊んで休む", "3〜5分ごとに水と休息を入れます。"], ["落ち着く手順を固定", "照明を落とす・マット・静かに噛む順を繰り返します。"]] },
  },
};

(["en", "zh", "ja"] as const).forEach((lang) => {
  (Object.keys(translatedTypeCore[lang]) as BehaviorTypeKey[]).forEach((key) => {
    behaviorTypes[lang][key] = { emoji: behaviorTypes.ko[key].emoji, ...translatedTypeCore[lang][key] };
  });
});

const popularBreeds: Breed[] = [
  { key: "maltese" },
  { key: "poodle" },
  { key: "pomeranian" },
  { key: "bichon" },
  { key: "shihTzu" },
  { key: "mixed" },
];

const moreBreedKeys: BreedKey[] = [
  "jindo", "yorkie", "chihuahua", "spitz", "dachshund", "corgi", "shiba", "minpin",
  "frenchie", "pug", "beagle", "schnauzer", "borderCollie", "golden", "labrador", "samoyed", "unknown",
];

const breedImages: Record<BreedKey, BreedImage> = {
  maltese: { src: "/maltese-profile.png" },
  poodle: { src: "/poodle-profile.png" },
  pomeranian: { src: "/pomeranian-profile.png" },
  bichon: { src: "/hero-bichon.png" },
  dachshund: { src: "/dachshund-profile.png" },
  mixed: { src: "/mixed-white-dog.png" },
  shihTzu: { src: "/breed-sheet-a.webp", position: "50% 0%" },
  jindo: { src: "/breed-sheet-a.webp", position: "100% 0%" },
  yorkie: { src: "/breed-sheet-a.webp", position: "0% 100%" },
  chihuahua: { src: "/breed-sheet-a.webp", position: "50% 100%" },
  spitz: { src: "/breed-sheet-a.webp", position: "100% 100%" },
  minpin: { src: "/breed-sheet-b.webp", position: "0% 0%" },
  corgi: { src: "/breed-sheet-b.webp", position: "50% 0%" },
  shiba: { src: "/breed-sheet-b.webp", position: "100% 0%" },
  frenchie: { src: "/breed-sheet-b.webp", position: "0% 100%" },
  pug: { src: "/breed-sheet-b.webp", position: "50% 100%" },
  beagle: { src: "/breed-sheet-b.webp", position: "100% 100%" },
  schnauzer: { src: "/breed-sheet-c.webp", position: "0% 0%" },
  borderCollie: { src: "/breed-sheet-c.webp", position: "50% 0%" },
  golden: { src: "/breed-sheet-c.webp", position: "100% 0%" },
  labrador: { src: "/breed-sheet-c.webp", position: "0% 100%" },
  samoyed: { src: "/breed-sheet-c.webp", position: "50% 100%" },
  unknown: { src: "/breed-sheet-c.webp", position: "100% 100%" },
};

const copy = {
  ko: {
    brandSub: "우리 강아지 행동케어",
    home: {
      kicker: "반가워요, 보호자님!",
      titleTop: "우리 집",
      titleAccent: "댕댕이는?",
      lead: "우리 아이에게 꼭 맞는 케어를 준비해드릴게요.",
      nameLabel: "우리 아이 이름은 무엇인가요?",
      namePlaceholder: "이름을 입력해주세요",
      popular: "인기 견종",
      pickHint: "사진을 눌러 선택",
      other: "다른 견종이에요",
      all: "전체 보기",
      start: "이 강아지로 시작하기",
      selectFirst: "강아지를 먼저 선택해주세요",
    },
    profile: {
      step: "맞춤 정보 입력",
      selected: "선택 완료",
      title: "조금만 더 알려주시면\n방법을 찾아드릴게요.",
      change: "견종 다시 선택하기",
      ageQ: "나이는 어떻게 되나요?",
      targetQ: "무엇을 가장 자주 물어뜯나요?",
      whenQ: "언제 가장 많이 하나요?",
      summary: "선택한 정보",
      next: "맞춤 홈으로 이동",
    },
    ages: ["6개월 이하", "7~12개월", "1~7세", "8세 이상"],
    targets: ["가구", "전선", "벽지", "신발", "매트", "기타"],
    whens: ["혼자 있을 때", "놀고 싶을 때", "잠들기 전", "수시로"],
    nav: ["맞춤 홈", "행동가이드", "7일 기록"],
    hub: {
      heroSmall: "오늘의 맞춤 케어",
      heroTitle: " 맞춤\n오늘의 케어",
      heroDesc: "필요한 정보부터 편하게 확인해보세요.",
      first: "가장 먼저 확인해보세요",
      solve: " 물어뜯기 해결 순서",
      solveDesc: "원인부터 대체 행동까지 3단계로 알려드립니다.",
      freeMenu: "무료 케어 메뉴",
      freeHint: "필요한 만큼 천천히",
      behavior: "물어뜯기\n행동가이드",
      breed: "\n생활가이드",
      science: "쓴맛과 행동학습",
      scienceDesc: "감각 경험이 멈춤 신호가 되는 과정을 확인해보세요.",
      view: "바로 보기",
      check: "확인하기",
      program: "7일 행동기록",
      programDesc: "비터케어 사용 전후의 변화를 사진과 메모로 남겨보세요.",
      programButton: "기록 시작하기",
    },
    guide: {
      tabs: ["행동 해결", "견종 생활", "쓴맛 학습"],
      evidence: "연구자료를 참고한 일반 안내",
      likely: "우리 아이는 지금\n{type}일\n가능성이 높아요.",
      types: ["탐색 + 이갈이형", "무료함 + 습관형", "건강 확인 + 습관형"],
      gentleTitle: "잘못된 행동이라기보다 원인이 있는 행동일 수 있어요.",
      gentleDesc: "혼내기보다 씹을 대상을 바꿔주는 것이 먼저예요.",
      today: "오늘부터 이렇게",
      order: "우리 아이의 해결 순서",
      actions: [
        ["{target} 접근을 먼저 줄여주세요", "물어뜯는 부위를 가리고, 혼자 있을 때는 접근 범위를 안전하게 제한해주세요."],
        ["씹어도 되는 대상을 바로 제공해주세요", "비슷한 촉감의 장난감을 가까이에 두고, 장난감을 선택하면 즉시 칭찬해주세요."],
        ["같은 시간대에 10분간 놀아주세요", "물어뜯기가 잦은 시간보다 먼저 짧은 냄새놀이와 씹기 활동을 시작해주세요."],
      ],
      breedTitle: "{breed} 생활 체크",
      breedLead: "견종의 일반적 경향과 우리 아이의 실제 반응을 함께 살펴보세요.",
      breedCards: [
        ["놀이와 산책", "짧고 규칙적인 활동으로 남는 에너지를 줄여주세요."],
        ["치아와 씹기", "딱딱함이 다른 안전한 장난감을 번갈아 제공해주세요."],
        ["혼자 있는 시간", "외출 전 냄새놀이를 준비하고 귀가 직후에는 차분히 인사해주세요."],
        ["피부와 털 관리", "핥기나 긁기가 갑자기 늘면 피부 상태를 먼저 확인해주세요."],
      ],
      breedNote: "견종만으로 행동 원인을 단정할 수 없습니다. 나이·건강·생활환경을 함께 확인해주세요.",
      brainSmall: "쓴맛과 뇌의 학습",
      brainTitle: "쓴맛이 알려주는\n‘멈춤 신호’",
      brainDesc: "강아지는 쓴맛 경험을 물건의 냄새·모양·위치와 연결할 수 있어요. 다만 씹고 싶은 욕구 자체가 사라지는 것은 아니므로 대체 행동과 칭찬을 함께 사용해야 합니다.",
      brainFlow: ["쓴맛", "감각", "기억"],
      sources: "참고자료 확인",
      sourceClose: "참고자료 접기",
      source1: "강아지의 쓴맛 민감도",
      source2: "섬엽피질과 맛 학습",
      environmentSmall: "생활용품을 반복해서 물어뜯는다면",
      environmentTitle: "환경 관리가 필요할 수 있어요.",
      environmentDesc: "비터케어는 물어뜯으면 안 되는 표면을 보호하고 대체 행동 학습을 돕는 보조수단입니다.",
      program: "7일 행동기록 시작하기",
      disclaimer: "이 정보는 일반적인 행동 가이드이며 진단이나 치료를 대신하지 않습니다. 갑작스러운 행동 변화, 이물 섭취, 치아 손상은 동물병원에 상담해주세요.",
    },
    program: {
      header: "7일 행동기록",
      customer: "비터케어 사용기",
      withDog: "와 함께",
      hero: "하루 한 번,\n변화를 기록해보세요.",
      introTitle: "사진으로 남기는 7일",
      introDesc: "물어뜯는 부위와 강아지 반응을 같은 각도에서 기록하면 변화를 비교하기 쉬워요.",
      progress: "일 기록 완료",
      photoSaved: "사진 저장 완료",
      notePlaceholder: "오늘 반응을 한 줄로 남겨주세요. 예: 냄새만 맡고 지나갔어요.",
      camera: "오늘의 물어뜯기 부위 찍기",
      replace: "사진 바꾸기",
      save: "사진과 기록 저장하기",
      saving: "저장 중...",
      saved: "기록이 안전하게 저장되었습니다.",
      error: "저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      privacy: "사진 위치정보를 별도로 수집하지 않으며, 기록은 익명 관리번호로 보관됩니다.",
      days: [
        ["DAY 1", "시작 전 모습", "보호할 장소와 물어뜯은 흔적을 촬영해주세요."],
        ["DAY 2", "밀착 상태 확인", "들뜬 부분 없이 단단히 붙어 있는지 확인해주세요."],
        ["DAY 3", "첫 반응 관찰", "접근·탐색·회피 반응을 짧게 기록해주세요."],
        ["DAY 4", "대체 행동 제공", "비슷한 촉감의 안전한 장난감을 함께 제공해주세요."],
        ["DAY 5", "환경 다시 조정", "반복되는 장소와 시간대를 확인해주세요."],
        ["DAY 6", "좋은 선택 칭찬", "장난감을 선택했을 때 바로 칭찬해주세요."],
        ["DAY 7", "변화 비교", "첫날 사진과 비교하고 다음 관리 계획을 정해주세요."],
      ],
    },
    aria: { language: "언어 선택", back: "이전 화면", home: "홈으로", upload: "사진 업로드" },
  },
  en: {
    brandSub: "Dog Behavior Care",
    home: { kicker: "Welcome, pet parent!", titleTop: "Who is", titleAccent: "your pup?", lead: "We’ll prepare care tailored to your dog.", nameLabel: "What is your pup’s name?", namePlaceholder: "Enter a name", popular: "Popular breeds", pickHint: "Tap a photo to choose", other: "My dog is different", all: "View all", start: "Continue with this dog", selectFirst: "Please choose your dog first" },
    profile: { step: "Care profile", selected: "selected", title: "Tell us a little more\nand we’ll find the right approach.", change: "Choose another breed", ageQ: "How old is your dog?", targetQ: "What does your dog chew most?", whenQ: "When does it happen most?", summary: "Your selections", next: "Go to my care home" },
    ages: ["6 months or less", "7–12 months", "1–7 years", "8+ years"],
    targets: ["Furniture", "Cables", "Wallpaper", "Shoes", "Mats", "Other"],
    whens: ["When alone", "When playful", "Before sleep", "Anytime"],
    nav: ["My care", "Guides", "7-day log"],
    hub: { heroSmall: "TODAY’S PERSONAL CARE", heroTitle: " care for\ntoday", heroDesc: "Start with the information you need most.", first: "Start here", solve: " chewing action plan", solveDesc: "A 3-step guide from cause to replacement behavior.", freeMenu: "Free care menu", freeHint: "Explore at your pace", behavior: "Chewing\naction guide", breed: "\nlifestyle guide", science: "Bitter taste & learning", scienceDesc: "See how sensory experience can become a stop signal.", view: "View now", check: "Open guide", program: "7-day behavior log", programDesc: "Record changes before and after BitterCare with photos and notes.", programButton: "Start logging" },
    guide: { tabs: ["Behavior", "Breed care", "Bitter learning"], evidence: "General guide informed by research", likely: "Your dog may be in a\n{type}\npattern right now.", types: ["exploration + teething", "boredom + habit", "health check + habit"], gentleTitle: "The behavior may have a cause rather than being ‘bad.’", gentleDesc: "Redirecting what your dog chews comes before scolding.", today: "Start today", order: "A practical action order", actions: [["Reduce access to {target}", "Cover the area and safely limit access when your dog is alone."], ["Offer an approved chewing option", "Keep a toy with a similar texture nearby and praise the right choice immediately."], ["Play for 10 minutes at the same time", "Begin a short sniffing or chewing activity before the usual chewing time."]], breedTitle: "{breed} lifestyle check", breedLead: "Compare general breed tendencies with your dog’s real behavior.", breedCards: [["Play & walks", "Use short, regular activities to reduce leftover energy."], ["Teeth & chewing", "Rotate safe toys with different firmness levels."], ["Time alone", "Prepare scent play before leaving and greet calmly when you return."], ["Skin & coat", "If licking or scratching suddenly increases, check the skin first."]], breedNote: "Breed alone cannot explain behavior. Consider age, health and environment together.", brainSmall: "BITTER TASTE & THE BRAIN", brainTitle: "A bitter-taste\n‘stop signal’", brainDesc: "Dogs can associate a bitter experience with an object’s smell, shape and location. Because the desire to chew can remain, pair it with an alternative behavior and praise.", brainFlow: ["Bitter", "Sense", "Memory"], sources: "View references", sourceClose: "Close references", source1: "Bitter taste sensitivity in dogs", source2: "Insular cortex and taste learning", environmentSmall: "If household chewing keeps repeating", environmentTitle: "Environmental management may help.", environmentDesc: "BitterCare helps protect surfaces and supports learning an alternative behavior.", program: "Start the 7-day behavior log", disclaimer: "This is general behavior guidance and does not replace diagnosis or treatment. Contact a veterinary clinic for sudden changes, swallowed objects or tooth damage." },
    program: { header: "7-day behavior log", customer: "BITTERCARE DIARY", withDog: "with", hero: "Record one change,\nonce a day.", introTitle: "Seven days in photos", introDesc: "Use the same angle for the chewed area and your dog’s reaction to compare changes clearly.", progress: "days completed", photoSaved: "Photo saved", notePlaceholder: "Write today’s reaction and anything that changed.", camera: "Take or choose a photo", replace: "Replace photo", save: "Save today’s log", saving: "Saving...", saved: "Your entry has been saved.", error: "Could not save. Please try again shortly.", privacy: "We do not separately collect photo location data. Entries use an anonymous case ID.", days: [["DAY 1", "Before you begin", "Photograph the target area and existing damage."], ["DAY 2", "Check adhesion", "Make sure there are no loose edges."], ["DAY 3", "Observe first response", "Note approach, exploration and avoidance."], ["DAY 4", "Offer an alternative", "Provide a safe toy with a similar texture."], ["DAY 5", "Adjust the environment", "Check recurring places and times."], ["DAY 6", "Praise the right choice", "Praise immediately when your dog chooses the toy."], ["DAY 7", "Compare changes", "Compare with Day 1 and plan the next step."]] },
    aria: { language: "Choose language", back: "Go back", home: "Home", upload: "Upload photo" },
  },
  zh: {
    brandSub: "狗狗行为护理",
    home: { kicker: "欢迎您，宠物家长！", titleTop: "您家的", titleAccent: "狗狗是？", lead: "我们将为它准备合适的护理建议。", nameLabel: "狗狗叫什么名字？", namePlaceholder: "请输入名字", popular: "热门犬种", pickHint: "点击照片选择", other: "没有我的犬种", all: "查看全部", start: "从这只狗狗开始", selectFirst: "请先选择您的狗狗" },
    profile: { step: "定制信息", selected: "已选择", title: "再告诉我们一点，\n就能找到合适的方法。", change: "重新选择犬种", ageQ: "狗狗多大了？", targetQ: "它最常啃咬什么？", whenQ: "通常什么时候发生？", summary: "已选信息", next: "进入定制主页" },
    ages: ["6个月以下", "7–12个月", "1–7岁", "8岁以上"], targets: ["家具", "电线", "墙纸", "鞋子", "垫子", "其他"], whens: ["独处时", "想玩时", "睡前", "随时"], nav: ["定制主页", "行为指南", "7天记录"],
    hub: { heroSmall: "今日定制护理", heroTitle: "的\n今日护理", heroDesc: "从最需要的信息开始查看。", first: "请先查看", solve: " 啃咬解决顺序", solveDesc: "从原因到替代行为，分3步说明。", freeMenu: "免费护理菜单", freeHint: "按需慢慢查看", behavior: "啃咬\n行为指南", breed: "\n生活指南", science: "苦味与行为学习", scienceDesc: "了解感官体验如何成为停止信号。", view: "立即查看", check: "查看指南", program: "7天行为记录", programDesc: "用照片和文字记录使用BitterCare前后的变化。", programButton: "开始记录" },
    guide: { tabs: ["行为解决", "犬种生活", "苦味学习"], evidence: "参考研究资料的一般指南", likely: "您的狗狗目前可能属于\n{type}\n类型。", types: ["探索＋换牙型", "无聊＋习惯型", "健康确认＋习惯型"], gentleTitle: "这可能是有原因的行为，而不是“坏行为”。", gentleDesc: "比起责备，先把啃咬对象换成安全物品。", today: "从今天开始", order: "解决问题的顺序", actions: [["先减少接触{target}", "遮挡啃咬部位，独处时安全限制活动范围。"], ["立即提供可啃咬的物品", "准备触感相似的玩具，选择玩具时马上表扬。"], ["在固定时间玩10分钟", "在常啃咬的时间之前先进行嗅闻或啃咬游戏。"]], breedTitle: "{breed}生活检查", breedLead: "请将犬种的一般倾向与狗狗的实际反应一起观察。", breedCards: [["玩耍与散步", "用短而规律的活动消耗剩余精力。"], ["牙齿与啃咬", "轮换提供硬度不同的安全玩具。"], ["独处时间", "外出前准备嗅闻游戏，回家后平静问候。"], ["皮肤与毛发", "突然频繁舔舐或抓挠时先检查皮肤。"]], breedNote: "不能只凭犬种判断行为原因，请同时考虑年龄、健康和生活环境。", brainSmall: "苦味与大脑学习", brainTitle: "苦味带来的\n“停止信号”", brainDesc: "狗狗可能把苦味体验与物体的气味、形状和位置联系起来。啃咬欲望仍可能存在，因此应同时提供替代行为并给予表扬。", brainFlow: ["苦味", "感觉", "记忆"], sources: "查看参考资料", sourceClose: "收起参考资料", source1: "狗狗的苦味敏感度", source2: "岛叶皮层与味觉学习", environmentSmall: "如果反复啃咬生活用品", environmentTitle: "可能需要调整环境。", environmentDesc: "BitterCare帮助保护不应啃咬的表面，并辅助替代行为学习。", program: "开始7天行为记录", disclaimer: "本内容为一般行为指南，不能替代诊断或治疗。如行为突然变化、吞食异物或牙齿受损，请咨询动物医院。" },
    program: { header: "7天行为记录", customer: "BITTERCARE使用日记", withDog: "和", hero: "每天一次，\n记录变化。", introTitle: "用照片记录7天", introDesc: "从相同角度拍摄啃咬部位和狗狗反应，更容易比较变化。", progress: "天已完成", photoSaved: "照片已保存", notePlaceholder: "记录今天的反应和变化。", camera: "拍照或选择照片", replace: "更换照片", save: "保存今日记录", saving: "保存中...", saved: "记录已安全保存。", error: "保存失败，请稍后重试。", privacy: "我们不会单独收集照片位置信息，记录使用匿名管理编号。", days: [["第1天", "开始前", "拍摄保护位置和现有啃咬痕迹。"], ["第2天", "检查贴合", "确认边缘没有翘起。"], ["第3天", "观察初次反应", "记录接近、探索和回避反应。"], ["第4天", "提供替代行为", "提供触感相似的安全玩具。"], ["第5天", "重新调整环境", "确认反复发生的地点和时间。"], ["第6天", "表扬正确选择", "选择玩具时立即表扬。"], ["第7天", "比较变化", "与第1天比较并制定后续计划。"]] },
    aria: { language: "选择语言", back: "返回", home: "主页", upload: "上传照片" },
  },
  ja: {
    brandSub: "愛犬の行動ケア",
    home: { kicker: "飼い主さま、ようこそ！", titleTop: "わが家の", titleAccent: "ワンちゃんは？", lead: "愛犬に合ったケアをご案内します。", nameLabel: "ワンちゃんのお名前は？", namePlaceholder: "名前を入力してください", popular: "人気の犬種", pickHint: "写真をタップして選択", other: "ほかの犬種です", all: "すべて見る", start: "このワンちゃんで始める", selectFirst: "愛犬を先に選んでください" },
    profile: { step: "カスタム情報", selected: "選択済み", title: "もう少し教えていただければ、\n合う方法をご案内します。", change: "犬種を選び直す", ageQ: "年齢を教えてください", targetQ: "何をよく噛みますか？", whenQ: "いつ多く見られますか？", summary: "選択した情報", next: "マイケアへ進む" },
    ages: ["6か月以下", "7〜12か月", "1〜7歳", "8歳以上"], targets: ["家具", "コード", "壁紙", "靴", "マット", "その他"], whens: ["留守番中", "遊びたい時", "寝る前", "いつでも"], nav: ["マイケア", "行動ガイド", "7日記録"],
    hub: { heroSmall: "今日のカスタムケア", heroTitle: "に合う\n今日のケア", heroDesc: "必要な情報から気軽にご覧ください。", first: "まずはこちら", solve: " 噛み対策の順番", solveDesc: "原因から代替行動まで3段階でご案内します。", freeMenu: "無料ケアメニュー", freeHint: "必要な分だけゆっくり", behavior: "噛み癖\n行動ガイド", breed: "\n暮らしガイド", science: "苦味と行動学習", scienceDesc: "感覚経験が停止の合図になる仕組みをご覧ください。", view: "今すぐ見る", check: "確認する", program: "7日行動記録", programDesc: "BitterCare使用前後の変化を写真とメモで残しましょう。", programButton: "記録を始める" },
    guide: { tabs: ["行動対策", "犬種の暮らし", "苦味学習"], evidence: "研究資料を参考にした一般ガイド", likely: "愛犬は現在\n{type}\nの可能性があります。", types: ["探索＋歯の生え替わり型", "退屈＋習慣型", "健康確認＋習慣型"], gentleTitle: "悪い行動ではなく、理由のある行動かもしれません。", gentleDesc: "叱る前に、噛む対象を安全なものへ変えましょう。", today: "今日からできること", order: "解決の順番", actions: [["{target}への接近を減らす", "噛む部分を覆い、留守番中は安全に行動範囲を制限します。"], ["噛んでよい物をすぐに用意する", "似た感触のおもちゃを近くに置き、選べたらすぐ褒めます。"], ["同じ時間に10分遊ぶ", "噛みやすい時間の前に短いノーズワークや噛む遊びを始めます。"]], breedTitle: "{breed}暮らしチェック", breedLead: "犬種の一般的な傾向と愛犬の実際の反応を一緒に見ましょう。", breedCards: [["遊びと散歩", "短く規則的な活動で余ったエネルギーを減らします。"], ["歯と噛む行動", "硬さの異なる安全なおもちゃを交互に用意します。"], ["留守番時間", "外出前にノーズワークを用意し、帰宅時は落ち着いて接します。"], ["皮膚と被毛", "舐めたり掻いたりする回数が急に増えたら皮膚を確認します。"]], breedNote: "犬種だけで原因を断定できません。年齢・健康・生活環境も一緒に確認してください。", brainSmall: "苦味と脳の学習", brainTitle: "苦味が伝える\n「停止の合図」", brainDesc: "犬は苦味の経験を物の匂い・形・場所と結び付けることがあります。噛みたい欲求は残るため、代替行動と褒めることを組み合わせてください。", brainFlow: ["苦味", "感覚", "記憶"], sources: "参考資料を見る", sourceClose: "参考資料を閉じる", source1: "犬の苦味感受性", source2: "島皮質と味覚学習", environmentSmall: "生活用品を繰り返し噛む場合", environmentTitle: "環境管理が役立つことがあります。", environmentDesc: "BitterCareは噛んではいけない表面を保護し、代替行動の学習を補助します。", program: "7日行動記録を始める", disclaimer: "本内容は一般的な行動ガイドで、診断や治療の代わりではありません。急な行動変化、異物の誤飲、歯の損傷は動物病院へご相談ください。" },
    program: { header: "7日行動記録", customer: "BITTERCARE使用日記", withDog: "と一緒に", hero: "1日1回、\n変化を記録しましょう。", introTitle: "写真で残す7日間", introDesc: "噛む場所と愛犬の反応を同じ角度で撮ると変化を比較しやすくなります。", progress: "日記録完了", photoSaved: "写真保存済み", notePlaceholder: "今日の反応と変わった点を入力してください。", camera: "撮影または写真を選択", replace: "写真を変更", save: "今日の記録を保存", saving: "保存中...", saved: "記録を保存しました。", error: "保存できませんでした。しばらくしてからお試しください。", privacy: "写真の位置情報を個別に収集せず、匿名の管理番号で記録します。", days: [["DAY 1", "開始前", "保護する場所と噛み跡を撮影します。"], ["DAY 2", "密着を確認", "端が浮いていないか確認します。"], ["DAY 3", "最初の反応", "接近・探索・回避反応を記録します。"], ["DAY 4", "代替行動", "似た感触の安全なおもちゃを用意します。"], ["DAY 5", "環境を再調整", "繰り返す場所と時間帯を確認します。"], ["DAY 6", "良い選択を褒める", "おもちゃを選んだらすぐ褒めます。"], ["DAY 7", "変化を比較", "初日と比較し次の管理計画を決めます。"]] },
    aria: { language: "言語を選択", back: "前の画面", home: "ホーム", upload: "写真をアップロード" },
  },
} as const;

function format(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);
}

function breedName(breed: Breed, lang: Lang) {
  return breedNames[breed.key][lang];
}

function petDisplayName(breed: Breed, lang: Lang, petName: string) {
  const cleanedName = petName.trim();
  return cleanedName ? `${breedName(breed, lang)}(${cleanedName})` : breedName(breed, lang);
}

function ArrowIcon() {
  return <span aria-hidden="true" className="arrow-icon">→</span>;
}

function ResultShareButtons({ lang, kind, breed, petName, title, hook, description, mbti, axes, onTrack }: { lang: Lang; kind: ShareKind; breed: Breed; petName: string; title: string; hook: string; description?: string; mbti?: string; axes?: ShareAxis[]; onTrack: TrackFunnel }) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const labels = {
    ko: { title: "친구에게 우리 아이 결과를 보여주세요 🐶", share: "친구에게 결과 공유하기", save: "결과 이미지 저장하기", kakao: "카카오톡", instagram: "Instagram", copy: "링크 복사", other: "다른 앱", close: "닫기" },
    en: { title: "Show your dog’s result to a friend 🐶", share: "Share with a friend", save: "Save result image", kakao: "KakaoTalk", instagram: "Instagram", copy: "Copy link", other: "More apps", close: "Close" },
    zh: { title: "把爱犬的结果分享给朋友吧 🐶", share: "分享结果", save: "保存图片", kakao: "KakaoTalk", instagram: "Instagram", copy: "复制链接", other: "其他应用", close: "关闭" },
    ja: { title: "愛犬の結果を友だちに見せましょう 🐶", share: "結果を共有", save: "画像を保存", kakao: "カカオトーク", instagram: "Instagram", copy: "リンクコピー", other: "その他", close: "閉じる" },
  }[lang];
  const eventPrefix = kind === "temperament" ? "temperament" : "chew";
  const shareOptions = {
    lang, kind, petName, resultTitle: title, hook, description, mbti, axes,
    breedImageSrc: breedImages[breed.key].src, breedImagePosition: breedImages[breed.key].position,
  };
  async function run(action: () => Promise<string>, trackShare = true) {
    if (trackShare) onTrack(`${eventPrefix}_share_click` as FunnelEventType, `${kind}_result`);
    try {
      const result = await action();
      if (result !== "shared") setMessage(result);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setMessage(lang === "ko" ? "공유를 완료하지 못했어요. 다른 방법을 이용해 주세요." : "Sharing was not completed. Please try another option.");
    }
  }
  return <section className={`result-share-panel share-${kind}`}>
    <span aria-hidden="true">↗</span><div><strong>{labels.title}</strong><div><button type="button" onClick={() => { setMessage(""); setOpen(true); }}>{labels.share}</button><button type="button" onClick={() => void run(async () => { onTrack(`${eventPrefix}_image_save` as FunnelEventType, `${kind}_result`); return await saveShareCard(shareOptions); }, false)}>{labels.save}</button></div>{message && <small role="status">{message}</small>}</div>
    {open && createPortal(<div className="share-sheet-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section className="share-sheet" role="dialog" aria-modal="true" aria-label={labels.share} onClick={(event) => event.stopPropagation()}>
        <div className="share-sheet-handle" />
        <div className="share-sheet-heading"><strong>{labels.share}</strong><button type="button" onClick={() => setOpen(false)} aria-label={labels.close}>×</button></div>
        <div className="share-sheet-grid">
          <button className="share-kakao" type="button" onClick={() => void run(() => shareKakaoCard(shareOptions))}><span>💬</span><strong>{labels.kakao}</strong></button>
          <button className="share-instagram" type="button" onClick={() => void run(() => shareInstagramCard(shareOptions))}><span>◎</span><strong>{labels.instagram}</strong></button>
          <button className="share-copy" type="button" onClick={() => void run(() => copyShareLink(shareOptions))}><span>🔗</span><strong>{labels.copy}</strong></button>
          <button className="share-other" type="button" onClick={() => void run(() => shareLinkOnly(shareOptions))}><span>↗</span><strong>{labels.other}</strong></button>
        </div>
        <p>app.bittercare.com</p>
      </section>
    </div>, document.body)}
  </section>;
}

function Brand({ lang, onClick }: { lang: Lang; onClick?: () => void }) {
  return (
    <button className="brand" type="button" aria-label={copy[lang].aria.home} onClick={onClick}>
      <img className="brand-reference-logo" src="/bittercare-logo-ref-v30.png" alt="BitterCare" />
    </button>
  );
}

function FlagIcon({ code }: { code: Lang }) {
  if (code === "ko") return <svg className="flag-svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="#fff" /><path d="M10 16a6 6 0 0 1 12 0 3 3 0 0 0-6 0 3 3 0 0 1-6 0Z" fill="#e83e50" /><path d="M22 16a6 6 0 0 1-12 0 3 3 0 0 0 6 0 3 3 0 0 1 6 0Z" fill="#2457a7" /><g stroke="#111" strokeWidth="1.2"><path d="m7 9 3-2M8 11l3-2M21 23l3-2M22 25l3-2" /><path d="m22 8 3 2M21 10l3 2M7 22l3 2M8 20l3 2" /></g></svg>;
  if (code === "en") return <svg className="flag-svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="#fff" />{[0, 6, 12, 18, 24, 30].map((y) => <rect key={y} y={y} width="32" height="3" fill="#d73b45" />)}<rect width="15" height="16" fill="#244a92" /><g fill="#fff">{[3, 8, 13].flatMap((x) => [3, 8, 13].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".8" />))}</g></svg>;
  if (code === "zh") return <svg className="flag-svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="#e43d3d" /><text x="7" y="15" fill="#ffd84d" fontSize="12">★</text><circle cx="20" cy="8" r="1.2" fill="#ffd84d" /><circle cx="23" cy="12" r="1.2" fill="#ffd84d" /><circle cx="23" cy="17" r="1.2" fill="#ffd84d" /><circle cx="20" cy="21" r="1.2" fill="#ffd84d" /></svg>;
  return <svg className="flag-svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="#fff" /><circle cx="16" cy="16" r="8" fill="#e8414f" /></svg>;
}

function LanguageMenu({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const current = languages.find((item) => item.key === lang)!;
  return (
    <div className="language-menu">
      <button className="language-trigger" type="button" aria-label={copy[lang].aria.language} aria-expanded={open} onClick={() => setOpen(!open)}>
        <FlagIcon code={current.key} /><strong>{current.label}</strong><i aria-hidden="true">{open ? "⌃" : "⌄"}</i>
      </button>
      {open && (
        <div className="language-popover">
          {languages.map((item) => (
            <button key={item.key} className={lang === item.key ? "active" : ""} type="button" onClick={() => { onChange(item.key); setOpen(false); }}>
              <FlagIcon code={item.key} /><strong>{item.label}</strong>{lang === item.key && <i>✓</i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BreedPortrait({ breed, lang, className = "" }: { breed: Breed; lang: Lang; className?: string }) {
  const name = breedName(breed, lang);
  const image = breedImages[breed.key];
  if (image.position) {
    return <span className={`breed-sprite ${className}`} role="img" aria-label={name} style={{ backgroundImage: `url(${image.src})`, backgroundPosition: image.position }} />;
  }
  return <img className={className} src={image.src} alt={name} />;
}

function PetProfilePill({ breed, petName, lang, onClick }: { breed: Breed; petName: string; lang: Lang; onClick: () => void }) {
  const label = petName.trim() || breedName(breed, lang);
  return <button className="profile-pill pet-profile-pill" type="button" onClick={onClick} title={petDisplayName(breed, lang, petName)}><span><BreedPortrait breed={breed} lang={lang} /></span><strong>{label}</strong></button>;
}

const homeDashboardCopy = {
  ko: {
    hello: "안녕하세요!",
    intro: "우리 강아지의 마음을\n함께 알아봐요",
    core: "핵심 기능",
    primary: [["3분\n우리 아이\n기질 체크", "성향 분석으로\n우리 아이를 더 이해해요"], ["멍멍\nOX 퀴즈", "알쏭달쏭한 강아지 상식,\nOX로 재미있게 확인!"], ["물어뜯기\n성향 체크", "왜 자꾸 물어뜯을까요?\n원인을 함께 알아봐요"], ["비터케어\n3일 기록", "사진과 함께 3일 동안\n변화를 확인해요"]],
    more: "주요 기능",
    secondary: ["성향 분석", "맞춤 솔루션", "비터케어 사용법", "성장 리포트"],
    tip: "오늘의 팁",
    tipBody: "짧은 산책도 우리 아이의 스트레스 해소에 도움이 돼요!",
    setupTitle: "우리 아이를 먼저 알려주세요",
    setupLead: "이름과 견종을 선택하면 기질 체크를 시작할 수 있어요.",
    close: "닫기",
    notifications: "우리 아이 알림",
    notificationLead: "지금 확인하면 좋은 내용을 모아두었어요.",
    temperamentNotice: "아직 기질 체크 전이에요",
    temperamentNoticeBody: "3분 체크로 우리 아이의 대표 성향을 먼저 알아보세요.",
    diaryNotice: "오늘 기록할 차례예요",
    diaryNoticeBody: "DAY {day} 사진과 반응을 남기면 변화를 비교하기 쉬워요.",
    reportNotice: "3일 변화 리포트가 준비됐어요",
    reportNoticeBody: "첫날과 마지막 날의 반응을 한눈에 확인해보세요.",
    viewNow: "확인하기",
    allCaughtUp: "새로운 알림이 없어요",
    allCaughtUpBody: "오늘의 팁을 확인하며 편안한 하루를 보내세요.",
  },
  en: {
    hello: "Hello!",
    intro: "Let’s understand\nyour dog together",
    core: "Core features",
    primary: [["3-min\ntemperament\ncheck", "Understand your dog\nthrough a quick profile"], ["Doggy\nOX quiz", "Make dog knowledge\nquick and fun"], ["Chewing\ntendency check", "Find out what may be\ndriving the chewing"], ["BitterCare\n3-day log", "Track three days of\nchange with photos"]],
    more: "More features",
    secondary: ["Profile", "Solutions", "How to use", "Progress report"],
    tip: "Today’s tip",
    tipBody: "Even a short walk can help your dog release stress.",
    setupTitle: "Tell us about your dog first",
    setupLead: "Choose a name and breed to begin the temperament check.",
    close: "Close",
    notifications: "My dog alerts", notificationLead: "Helpful updates for you and your dog.",
    temperamentNotice: "Temperament check not started", temperamentNoticeBody: "Take the 3-minute check to discover your dog’s main traits.",
    diaryNotice: "Time for today’s entry", diaryNoticeBody: "Add the DAY {day} photo and reaction to compare changes.",
    reportNotice: "Your 3-day report is ready", reportNoticeBody: "Compare the first and final day at a glance.",
    viewNow: "View", allCaughtUp: "You’re all caught up", allCaughtUpBody: "Check today’s tip and enjoy a calm day together.",
  },
  zh: {
    hello: "您好！",
    intro: "一起了解\n狗狗的内心吧",
    core: "核心功能",
    primary: [["3分钟\n性格测试", "通过性格分析\n更了解爱犬"], ["狗狗\nOX问答", "轻松有趣地\n确认养犬常识"], ["啃咬\n倾向测试", "一起找出\n反复啃咬的原因"], ["BitterCare\n3天记录", "用照片记录\n三天的变化"]],
    more: "主要功能",
    secondary: ["性格分析", "定制方案", "使用方法", "成长报告"],
    tip: "今日提示",
    tipBody: "短时间散步也有助于缓解狗狗的压力。",
    setupTitle: "请先介绍您的爱犬",
    setupLead: "输入名字并选择犬种，即可开始性格测试。",
    close: "关闭",
    notifications: "爱犬提醒", notificationLead: "为您整理了现在值得查看的内容。",
    temperamentNotice: "尚未进行性格测试", temperamentNoticeBody: "用3分钟了解爱犬的主要性格。",
    diaryNotice: "今天该记录了", diaryNoticeBody: "上传第{day}天的照片和反应，更容易比较变化。",
    reportNotice: "3天变化报告已完成", reportNoticeBody: "一眼比较第一天和最后一天的反应。",
    viewNow: "查看", allCaughtUp: "暂无新提醒", allCaughtUpBody: "看看今日提示，和爱犬度过轻松的一天。",
  },
  ja: {
    hello: "こんにちは！",
    intro: "愛犬の気持ちを\n一緒に知りましょう",
    core: "メイン機能",
    primary: [["3分\n性格チェック", "性格分析で\n愛犬をもっと理解"], ["わんわん\nOXクイズ", "犬の知識を\n楽しくチェック"], ["噛み癖\n傾向チェック", "噛む理由を\n一緒に探ります"], ["BitterCare\n3日記録", "写真で3日間の\n変化を確認"]],
    more: "便利な機能",
    secondary: ["性格分析", "個別対策", "使い方", "成長レポート"],
    tip: "今日のヒント",
    tipBody: "短い散歩でも愛犬のストレス解消に役立ちます。",
    setupTitle: "まず愛犬について教えてください",
    setupLead: "名前と犬種を選ぶと性格チェックを始められます。",
    close: "閉じる",
    notifications: "愛犬のお知らせ", notificationLead: "今チェックしたい内容をまとめました。",
    temperamentNotice: "性格チェックはまだです", temperamentNoticeBody: "3分チェックで愛犬の主な性格を知りましょう。",
    diaryNotice: "今日の記録をしましょう", diaryNoticeBody: "DAY {day}の写真と反応を残すと変化を比べやすくなります。",
    reportNotice: "3日変化レポートができました", reportNoticeBody: "初日と最終日の反応をひと目で比べられます。",
    viewNow: "確認する", allCaughtUp: "新しいお知らせはありません", allCaughtUpBody: "今日のヒントを見て、穏やかな一日をお過ごしください。",
  },
} as const;

function HomeScreen({ lang, onLangChange, selectedBreed, petName, onPetNameChange, onSelect, onNext, onQuiz, onChew, onProgram, openSetupRequest }: { lang: Lang; onLangChange: (lang: Lang) => void; selectedBreed: Breed | null; petName: string; onPetNameChange: (name: string) => void; onSelect: (breed: Breed) => void; onNext: () => void; onQuiz: () => void; onChew: () => void; onProgram: () => void; openSetupRequest: number }) {
  const [showMore, setShowMore] = useState(false);
  const [showSetup, setShowSetup] = useState(openSetupRequest > 0);
  const t = copy[lang];
  const h = homeDashboardCopy[lang];
  const todayLabel = new Intl.DateTimeFormat({ ko: "ko-KR", en: "en-US", zh: "zh-CN", ja: "ja-JP" }[lang], { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  const startTemperament = () => selectedBreed ? onNext() : setShowSetup(true);
  const primaryActions = [startTemperament, onQuiz, onChew, onProgram];
  const primaryArt = ["/home-v49-ref-temperament.png", "/home-v49-ref-quiz.png", "/home-v49-ref-chew.png", "/home-v49-ref-diary.png"];
  if (showSetup) {
    return (
      <div className="screen home-setup-page">
        <header className="step-header">
          <button className="back-button" type="button" onClick={() => setShowSetup(false)} aria-label={t.aria.back}>←</button>
          <Brand lang={lang} onClick={() => setShowSetup(false)} />
          <LanguageMenu lang={lang} onChange={onLangChange} />
        </header>
        <main>
          <section className="home-setup-page-hero">
            <div><small>BITTERCARE · START</small><h1>{h.setupTitle}</h1><p>{h.setupLead}</p></div>
            <img src="/home-v49-ref-temperament.png" alt="" aria-hidden="true" />
          </section>
          <label className="pet-name-field"><span>{t.home.nameLabel}</span><div><input type="text" value={petName} onChange={(event) => onPetNameChange(event.target.value.slice(0, 12))} placeholder={t.home.namePlaceholder} maxLength={12} autoComplete="off" /><b>{petName.length}/12</b></div></label>
          <section className="breed-picker" aria-labelledby="home-setup-breed-title"><div className="picker-heading"><h2 id="home-setup-breed-title">{t.home.popular}</h2><span>{t.home.pickHint}</span></div><div className="breed-card-grid">{popularBreeds.map((breed, index) => { const selected = selectedBreed?.key === breed.key; return <button key={breed.key} className={selected ? "breed-card selected" : "breed-card"} type="button" aria-pressed={selected} onClick={() => onSelect(breed)}><span className="breed-rank" aria-hidden="true">{index + 1}</span><span className="breed-photo"><BreedPortrait breed={breed} lang={lang} /></span><strong>{breedName(breed, lang)}</strong>{selected && <i aria-hidden="true">✓</i>}</button>; })}</div><button className="more-breeds-button" type="button" onClick={() => setShowMore(!showMore)} aria-expanded={showMore}><span>{t.home.other}</span><strong>{t.home.all}</strong><i>{showMore ? "−" : "+"}</i></button>{showMore && <div className="more-breed-grid">{moreBreedKeys.map((key) => { const breed = { key } as Breed; const selected = selectedBreed?.key === key; return <button key={key} className={selected ? "breed-card selected" : "breed-card"} type="button" aria-pressed={selected} onClick={() => onSelect(breed)}><span className="breed-photo"><BreedPortrait breed={breed} lang={lang} /></span><strong>{breedNames[key][lang]}</strong>{selected && <i aria-hidden="true">✓</i>}</button>; })}</div>}</section>
          <button className="primary-button home-setup-start" type="button" onClick={onNext} disabled={!selectedBreed}>{selectedBreed ? t.home.start : t.home.selectFirst}</button>
        </main>
      </div>
    );
  }

  return (
    <div className="screen home-screen home-dashboard-screen">
      <header className="home-dashboard-topbar"><img className="home-dashboard-brand" src="/home-v49-ref-brand.png" alt="BitterCare" /><div className="home-dashboard-tools">{selectedBreed && <PetProfilePill breed={selectedBreed} petName={petName} lang={lang} onClick={() => setShowSetup(true)} />}<LanguageMenu lang={lang} onChange={onLangChange} /></div></header>
      <main>
        <section className="home-dashboard-hero"><div className="home-dashboard-hero-copy"><h1>{h.hello}<img src="/home-v49-ref-wave.png" alt="" aria-hidden="true" /></h1><p>{h.intro.split("\n").map((line) => <span key={line}>{line}</span>)}<img src="/home-v49-ref-heart.png" alt="" aria-hidden="true" /></p></div><img className="home-dashboard-dog" src="/home-v49-ref-hero-dog.png" alt="밝게 웃는 흰색 강아지" /></section>
        <section className="home-dashboard-core" aria-label={h.core}><div className="home-dashboard-core-grid">{h.primary.map((item, index) => <button key={item[0]} type="button" className={`home-dashboard-card card-${index + 1}`} onClick={primaryActions[index]}><img className="home-dashboard-card-art" src={primaryArt[index]} alt="" aria-hidden="true" /><span className="home-dashboard-card-copy"><strong>{item[0].split("\n").map((line) => <span key={line}>{line}</span>)}</strong><small>{item[1].split("\n").map((line) => <span key={line}>{line}</span>)}</small></span><img className="home-dashboard-card-arrow" src="/home-v49-ref-card-arrow.png" alt="" aria-hidden="true" /></button>)}</div></section>
        <section className="home-dashboard-tip"><img src="/home-v49-ref-tip-dog.png" alt="손을 흔드는 강아지 캐릭터" /><div><div className="home-dashboard-tip-heading"><h2>{h.tip}</h2><time>{todayLabel}</time></div><p>{h.tipBody}</p></div></section>
      </main>
      <BottomNav lang={lang} current="home" onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onGuide={startTemperament} onQuiz={onQuiz} onChew={onChew} onProgram={onProgram} />
    </div>
  );
}

function ChewScreen({ lang, onLangChange, breed, petName, caseId, age, target, when, answers, onAgeChange, onTargetChange, onWhenChange, onAnswerChange, onBack, onHome, onGuide, onQuiz, onProduct, onProgram, onPlan, onTrack }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; caseId: string; age: number; target: number; when: number; answers: (number | null)[]; onAgeChange: (value: number) => void; onTargetChange: (value: number) => void; onWhenChange: (value: number) => void; onAnswerChange: (index: number, value: number) => void; onBack: () => void; onHome: () => void; onGuide: () => void; onQuiz: () => void; onProduct: () => void; onProgram: () => void; onPlan: () => void; onTrack: TrackFunnel }) {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const t = copy[lang];
  const x = experienceCopy[lang];
  const name = petDisplayName(breed, lang, petName);
  const completed = answers.filter((answer) => answer !== null).length;
  const currentQuestion = chewQuestions[activeQuestion];
  const answerQuestion = (value: number) => {
    onAnswerChange(activeQuestion, value);
    if (activeQuestion < chewQuestions.length - 1) {
      window.setTimeout(() => setActiveQuestion((question) => Math.min(chewQuestions.length - 1, question + 1)), 180);
    }
  };
  const openChewResult = () => {
    const normalizedAnswers = answers.map((answer) => answer ?? 0);
    const result = calculateChewResult(normalizedAnswers, lang, age, when);
    void saveAssessment({
      caseId,
      assessmentType: "chewing",
      breed: breed.key,
      petName,
      language: lang,
      answers: { age, target, when, responses: normalizedAnswers },
      result: { ...result, targetLabel: t.targets[target], whenLabel: t.whens[when] },
    }).catch(() => undefined);
    onTrack("chew_complete", "chew");
    onPlan();
  };
  const assessment = {
    ko: { eyebrow: "12개 질문 · 8개 행동축", title: `${name}는 왜 물어뜯을까요?`, lead: "정답은 없어요. 최근 2주 동안 가장 가까웠던 모습을 눌러주세요.", progress: "성향 힌트 수집 중", checkpoint: ["우리 아이의 탐색 습관을 살펴보고 있어요", "절반 완료! 감정 신호도 함께 확인해요", "거의 다 왔어요. 관심 전환 정도를 볼게요"], ready: "분석 준비 완료", cta: "우리 아이 물어뜯기 결과 보기" },
    en: { eyebrow: "12 QUESTIONS · 8 BEHAVIOR AXES", title: `Why does ${name} chew?`, lead: "There are no right answers. Choose what was closest over the past two weeks.", progress: "Collecting behavior clues", checkpoint: ["Exploration clues are appearing", "Halfway! Now checking emotional signals", "Almost there—checking attention switching"], ready: "Ready to analyze", cta: "View my dog’s chewing result" },
    zh: { eyebrow: "12个问题 · 8个行为轴", title: `${name}为什么会啃咬？`, lead: "没有正确答案。请选择最近两周最接近的表现。", progress: "正在收集行为线索", checkpoint: ["正在了解探索习惯", "完成一半！继续确认情绪信号", "马上完成，最后确认注意转换"], ready: "分析准备完成", cta: "查看爱犬的啃咬结果" },
    ja: { eyebrow: "12の質問 · 8つの行動軸", title: `${name}はなぜ噛むのでしょう？`, lead: "正解はありません。最近2週間で最も近い様子を選んでください。", progress: "行動のヒントを収集中", checkpoint: ["探索の習慣が見えてきました", "半分完了！感情のサインも確認します", "あと少し、切り替えやすさを見ます"], ready: "分析の準備完了", cta: "愛犬の噛み癖結果を見る" },
  }[lang];
  return (
    <div className="screen profile-screen chew-screen">
      <header className="step-header"><button className="back-button" type="button" onClick={onBack} aria-label={t.aria.back}>←</button><Brand lang={lang} onClick={onBack} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
      <main>
        <div className="profile-title"><div className="mini-dog"><BreedPortrait breed={breed} lang={lang} /></div><div><p>{x.chewBadge}</p><h1>{x.chewScreenTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1></div></div>
        <p className="chew-screen-lead">{x.chewScreenLead}</p>
        <section className="form-section"><label className="section-label">{t.profile.ageQ}</label><div className="chip-row age-row">{t.ages.map((item, index) => <button key={item} className={age === index ? "chip selected" : "chip"} type="button" onClick={() => onAgeChange(index)}>{item}</button>)}</div></section>
        <section className="form-section"><label className="section-label">{t.profile.targetQ}</label><div className="target-grid photo-target-grid">{t.targets.map((item, index) => <button key={item} className={target === index ? "target-card selected" : "target-card"} type="button" onClick={() => onTargetChange(index)}><span className="target-photo" aria-hidden="true" style={{ backgroundPosition: chewTargetPositions[index] }} /><strong>{item}</strong>{target === index && <i aria-hidden="true">✓</i>}</button>)}</div></section>
        <section className="when-section"><label className="section-label">{t.profile.whenQ}</label><div className="chip-row">{t.whens.map((item, index) => <button key={item} className={when === index ? "chip selected" : "chip"} type="button" onClick={() => onWhenChange(index)}>{item}</button>)}</div></section>
        <div className="selection-summary"><span>{t.profile.summary}</span><strong>{name} · {t.ages[age]} · {t.targets[target]}</strong></div>
        <section className="chew-assessment-section">
          <div className="chew-assessment-intro"><small>{assessment.eyebrow}</small><h2>{assessment.title}</h2><p>{assessment.lead}</p><div className="chew-assessment-progress"><span><i style={{ width: `${(completed / chewQuestions.length) * 100}%` }} /></span><strong>{completed} / {chewQuestions.length}</strong></div></div>
          <div className="chew-question-list single-question">
            <article key={currentQuestion.text.ko} className={answers[activeQuestion] !== null ? "answered" : ""}>
              <header><b>{activeQuestion + 1}</b><span aria-hidden="true">{currentQuestion.icon}</span><h3>{currentQuestion.text[lang]}</h3></header>
              <div className="chew-scale" role="radiogroup" aria-label={currentQuestion.text[lang]}>{chewScale[lang].map((label, value) => <button key={label} type="button" role="radio" aria-checked={answers[activeQuestion] === value} className={answers[activeQuestion] === value ? "selected" : ""} onClick={() => answerQuestion(value)}><b>{value}</b><span>{label}</span></button>)}</div>
              {[3, 7, 11].includes(activeQuestion) && answers.slice(0, activeQuestion + 1).every((answer) => answer !== null) && <p className="chew-checkpoint">✨ {assessment.checkpoint[activeQuestion === 3 ? 0 : activeQuestion === 7 ? 1 : 2]}</p>}
            </article>
            <div className="single-question-controls auto-advance">
              <button type="button" onClick={() => setActiveQuestion((value) => Math.max(0, value - 1))} disabled={activeQuestion === 0}>← {lang === "ko" ? "이전" : lang === "en" ? "Previous" : lang === "zh" ? "上一题" : "前へ"}</button>
              <span>{activeQuestion + 1} / {chewQuestions.length}</span>
            </div>
          </div>
        </section>
        <button className="primary-button sticky-action chew-result-button" type="button" onClick={openChewResult} disabled={completed !== chewQuestions.length}>{completed === chewQuestions.length ? assessment.ready : `${assessment.progress} · ${completed}/${chewQuestions.length}`}<span>{assessment.cta} <ArrowIcon /></span></button>
      </main>
      <BottomNav lang={lang} current="chew" onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={() => {}} onProduct={onProduct} onProgram={onProgram} />
    </div>
  );
}

function ChewPlanScreen({ lang, onLangChange, breed, petName, age, target, when, answers, onBack, onHome, onGuide, onQuiz, onChew, onRetry, onProduct, onProgramGate, onTrack }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; age: number; target: number; when: number; answers: number[]; onBack: () => void; onHome: () => void; onGuide: () => void; onQuiz: () => void; onChew: () => void; onRetry: () => void; onProduct: () => void; onProgramGate: () => void; onTrack: TrackFunnel }) {
  const t = copy[lang];
  const name = petDisplayName(breed, lang, petName);
  const result = calculateChewResult(answers, lang, age, when);
  const r = {
    ko: { badge: "우리 아이 물어뜯기 성향", intro: `${name}의 결과`, cause: "물어뜯기 시작점", caution: "물어뜯기 주의도", axes: "8개 행동축 자세히 보기", plan: `${name}에게 맞는 3단계`, product: "비터케어는 원인을 없애는 제품이 아니라, 보호할 곳의 경계를 만드는 행동관리 보조 도구입니다.", cta: "비터케어로 보호하는 방법 보기", retry: "다시 체크하기" },
    en: { badge: "MY DOG’S CHEWING PATTERN", intro: `${name}’s result`, cause: "Likely starting point", caution: "Chewing attention level", axes: "View all 8 behavior axes", plan: `A 3-step plan for ${name}`, product: "BitterCare does not remove the cause. It is a behavior-support tool that helps mark and protect boundaries.", cta: "See how BitterCare protects", retry: "Check again" },
    zh: { badge: "爱犬啃咬性格", intro: `${name}的结果`, cause: "啃咬行为起点", caution: "啃咬注意度", axes: "查看8个行为轴", plan: `适合${name}的3个步骤`, product: "BitterCare并不能消除原因，而是帮助保护表面并建立边界的行为管理辅助工具。", cta: "查看BitterCare保护方法", retry: "重新测试" },
    ja: { badge: "愛犬の噛み癖タイプ", intro: `${name}の結果`, cause: "噛む行動のきっかけ", caution: "噛み癖の注意度", axes: "8つの行動軸を詳しく見る", plan: `${name}に合う3ステップ`, product: "BitterCareは原因をなくす製品ではなく、守る場所の境界を作る行動管理の補助ツールです。", cta: "BitterCareで守る方法を見る", retry: "もう一度チェック" },
  }[lang];
  return <div className="screen profile-screen chew-plan-screen">
    <header className="step-header"><button className="back-button" type="button" onClick={onBack} aria-label={t.aria.back}>←</button><Brand lang={lang} onClick={onHome} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
    <main>
      <section className="chew-persona-card"><div className="chew-persona-top"><div><small>{r.badge}</small><p>{r.intro}</p><h1>{result.title}</h1></div><div className="chew-result-dog"><BreedPortrait breed={breed} lang={lang} /></div></div><div className="top-axis-pills">{result.topAxes.map((axis, index) => <span key={axis.key}><b>{index + 1}</b>{axis.label}<strong>{axis.score}</strong></span>)}</div><p className="chew-result-summary">{result.summary}</p><div className="chew-cause-card"><small>{r.cause}</small><strong>{result.cause}</strong></div><div className="chew-caution"><span>{r.caution}</span><strong>{result.caution}</strong></div></section>
      <ResultShareButtons
        lang={lang}
        kind="chewing"
        breed={breed}
        petName={petName}
        title={result.title}
        hook={result.summary}
        description={result.cause}
        axes={chewAxisOrder.map((key) => ({ label: chewAxisLabels[key][lang], score: result.scores[key] }))}
        onTrack={onTrack}
      />
      <section className="chew-watch-card"><h2>👀 {result.watchTitle}</h2><div>{result.watch.map((item) => <span key={item}>{item}</span>)}</div></section>
      <details className="chew-axes-details" open><summary>{r.axes}<span>＋</span></summary><div>{chewAxisOrder.map((key) => <article key={key}><label>{chewAxisLabels[key][lang]}<strong>{result.scores[key]}</strong></label><span><i style={{ width: `${result.scores[key]}%` }} /></span></article>)}</div></details>
      <section className="chew-personal-plan"><small>PERSONAL ACTION PLAN</small><h2>{r.plan}</h2><div>{result.steps.map((step, index) => <article key={step}><b>{index + 1}</b><strong>{step}</strong></article>)}</div></section>
      <section className="chew-product-bridge"><div><small>BITTERCARE · PERSONAL TIP</small><h2>{result.productTitle}</h2><p>{result.productBody}</p><p className="chew-product-note">{r.product}</p><button type="button" onClick={onProduct}>{r.cta} <ArrowIcon /></button></div><div className="chew-bridge-dog"><BreedPortrait breed={breed} lang={lang} /></div></section>
      <button className="chew-retry-button" type="button" onClick={onRetry}>↻ {r.retry}</button>
      <section className="photo-challenge-card">
        <div className="photo-challenge-heading"><img src="/nav-dog-v30.png" alt="" aria-hidden="true" /><div><small>{photoChallengeCopy[lang].badge}</small><h2>{lang === "ko" ? "비터케어 3일 반응 기록" : photoChallengeCopy[lang].title.replace("\n", " ")}</h2><p>{photoChallengeCopy[lang].body}</p></div></div>
        <div className="photo-challenge-journey"><div className="photo-challenge-days">{photoChallengeCopy[lang].days.map((day, index) => <div key={day}><b>{index + 1}</b><strong>{day.split("\n").map((line, lineIndex) => <span key={line}>{lineIndex > 0 && <br />}{line}</span>)}</strong><i aria-hidden="true">{index === 0 ? "✓" : "●"}</i></div>)}</div><div className="photo-challenge-dog"><BreedPortrait breed={breed} lang={lang} /></div></div>
        <div className="photo-challenge-tip">{photoChallengeCopy[lang].tip}</div>
        <button className="diary-result-cta" type="button" onClick={onProgramGate}>{photoChallengeCopy[lang].cta} <ArrowIcon /></button>
      </section>
    </main>
    <BottomNav lang={lang} current="chew" onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={onChew} onProduct={onProduct} onProgram={onProgramGate} />
  </div>;
}

function ProductGuideScreen({ lang, onLangChange, breed, petName, onBack, onHome, onGuide, onQuiz, onChew, onProgram, onTrack }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; onBack: () => void; onHome: () => void; onGuide: () => void; onQuiz: () => void; onChew: () => void; onProgram: () => void; onTrack: TrackFunnel }) {
  const p = productGuideCopy[lang];
  const stores = storePickerCopy[lang];
  const [showStores, setShowStores] = useState(false);
  const [openUsageStep, setOpenUsageStep] = useState<number | null>(null);
  const productViewTracked = useRef(false);

  useEffect(() => {
    if (productViewTracked.current) return;
    productViewTracked.current = true;
    onTrack("product_view", "product");
  }, [onTrack]);

  useEffect(() => {
    if (!showStores) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowStores(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showStores]);

  const openStorePicker = (position: "top" | "bottom") => {
    onTrack("buy_button_click", `product_${position}`);
    setShowStores(true);
  };

  return <div className="screen product-guide-screen">
    <header className="step-header guide-header"><button className="back-button" type="button" onClick={onBack} aria-label={copy[lang].aria.back}>←</button><Brand lang={lang} onClick={onHome} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
    <main>
      <section className="product-guide-hero"><small>{p.badge}</small><h1>{p.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><p>{p.body}</p><div className="product-key-points">{p.points.map((point, index) => <article key={point}><b>{index + 1}</b><strong>{point}</strong></article>)}</div></section>
      <div className="product-buy-cta product-buy-cta-top"><p>{p.buyLead}</p><button className="product-buy-button" type="button" onClick={() => openStorePicker("top")}>{p.buy} <ArrowIcon /></button></div>
      <section className="howto-video-section">
        <div className="howto-video-heading"><small>1 MIN · QUICK GUIDE</small><h2>{p.videoTitle}</h2><p>{p.videoHint}</p></div>
        <video autoPlay muted loop playsInline controls preload="metadata" poster="/bittercare-howto-poster.webp" aria-label={p.videoTitle}>
          <source src="/bittercare-howto.mp4" type="video/mp4" />
        </video>
      </section>
      <section className="usage-guide-section">
        <div className="usage-guide-heading"><small>5 QUICK CHECKS</small><h2>{p.usage}</h2></div>
        <p className="usage-guide-hint">{p.usageHint}</p>
        <div className="usage-accordion">{p.steps.map(([title, detail], index) => {
          const step = index + 1;
          const isOpen = openUsageStep === index;
          return <article key={title} className={isOpen ? "open" : ""}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpenUsageStep(isOpen ? null : index)}>
              <span className="usage-step-number">{step}</span><strong>{title}</strong><span className="usage-step-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className="usage-step-detail"><p>{detail}</p><figure className={step === 3 ? "unified-guide-title" : ""}><img src={`/bittercare-guide-${step}.webp`} alt={`${p.imageAlt} ${step}/5`} loading="lazy" />{step === 3 && lang === "ko" && <div className="guide-title-overlay" aria-hidden="true"><strong>필요한 부위에</strong><strong>넓게 붙이세요</strong></div>}</figure></div>}
          </article>;
        })}</div>
        <aside className="usage-after-tips"><strong>{p.tipsTitle}</strong><div><span>↻ {p.tips[0]}</span><span>🧸 {p.tips[1]}</span></div></aside>
      </section>
      <div className="product-buy-cta"><p>{p.buyLead}</p><button className="product-buy-button" type="button" onClick={() => openStorePicker("bottom")}>{p.buy} <ArrowIcon /></button></div>
    </main>
    <BottomNav lang={lang} current={null} onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={onChew} onProduct={() => window.scrollTo({ top: 0, behavior: "smooth" })} onProgram={onProgram} />
    {showStores && typeof document !== "undefined" && createPortal(<div className="store-picker-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setShowStores(false); }}>
      <section className="store-picker" role="dialog" aria-modal="true" aria-labelledby="store-picker-title">
        <button className="store-picker-close" type="button" onClick={() => setShowStores(false)} aria-label={stores.close}>×</button>
        <small>{stores.eyebrow}</small>
        <h2 id="store-picker-title">{stores.title}</h2>
        <p>{stores.lead}</p>
        <div className="store-picker-links">
          <a className="coupang" href="https://link.coupang.com/a/f7w18fuqbs" target="_blank" rel="noreferrer sponsored" onClick={() => onTrack("coupang_click", "purchase_modal", "coupang", true)}><span>쿠팡</span><strong>{stores.coupang}</strong><b aria-hidden="true">→</b></a>
          <a className="smart-store" href="https://m.smartstore.naver.com/bittercare-bitterbooks" target="_blank" rel="noreferrer" onClick={() => onTrack("smartstore_click", "purchase_modal", "smartstore", true)}><span>N</span><strong>{stores.smartStore}</strong><b aria-hidden="true">→</b></a>
        </div>
      </section>
    </div>, document.body)}
  </div>;
}

type NavDestination = "home" | "guide" | "quiz" | "chew" | "program";

function BottomNav({ lang, current, onHome, onGuide, onQuiz, onChew, onProduct, onProgram }: {
  lang: Lang; current: NavDestination | null; onHome: () => void; onGuide: () => void; onQuiz: () => void; onChew: () => void;
  onProduct?: () => void; onProgram?: () => void; showDiaryPreview?: boolean;
}) {
  const n = navigationCopy[lang];
  const items: { key: NavDestination; icon: string; label: string; action: () => void }[] = [
    { key: "home", icon: "/nav-home-v30.png", label: n.labels[0], action: onHome },
    { key: "guide", icon: "/nav-dog-v30.png", label: n.labels[1], action: onGuide },
    { key: "quiz", icon: "/nav-quiz-v30.png", label: n.labels[2], action: onQuiz },
    { key: "chew", icon: "/nav-chew-v30.png", label: chewNavCopy[lang], action: onChew },
    { key: "program", icon: "/home-v49-ref-diary.png", label: lang === "ko" ? "비터케어\n3일 기록" : lang === "en" ? "BitterCare\n3-day log" : lang === "zh" ? "BitterCare\n3天记录" : "BitterCare\n3日記録", action: onProgram || onProduct || onHome },
  ];
  return <nav className="bottom-nav" aria-label="navigation">
    <div className="bottom-nav-row">
      <div className="nav-destinations">{items.map((item) => <button key={item.key} className={current === item.key ? "active" : ""} type="button" onClick={item.action}><img className="nav-icon-image" src={item.icon} alt="" aria-hidden="true" /><small>{item.label.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</small></button>)}</div>
    </div>
  </nav>;
}

function QuizScreen({ lang, onLangChange, breed, petName, quizIndex, onNextQuiz, onGuide, onHome, onChew, onProduct, onProgram }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; quizIndex: number; onNextQuiz: () => void; onGuide: () => void; onHome: () => void; onChew: () => void; onProduct: () => void; onProgram: () => void }) {
  const [quizChoice, setQuizChoice] = useState<"yes" | "no" | null>(null);
  const f = funnelCopy[lang];
  const feedback = quizFeedback[lang];
  const quiz = quizBank[lang][quizIndex];
  const quizIsCorrect = quizChoice !== null && (quizChoice === "yes") === quiz.answer;
  const nextQuestion = () => {
    setQuizChoice(null);
    onNextQuiz();
  };

  return (
    <div className="screen hub-screen focus-hub">
      <header className="hub-header"><Brand lang={lang} onClick={onHome} /><div className="hub-header-actions"><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></div></header>
      <main>
        <section className="quiz-front">
          <span className="quiz-sticker">OX</span>
          <div className="quiz-dog"><BreedPortrait breed={breed} lang={lang} /></div>
          <small>{f.quizKicker}</small>
          <h1>{quiz.question}</h1>
          <p>{f.quizHint}</p>
          <div className="ox-buttons"><button type="button" className={quizChoice === "yes" ? `selected ${quizIsCorrect ? "correct" : ""}` : ""} onClick={() => setQuizChoice("yes")}><b>O</b><span>{feedback.trueLabel}</span></button><button type="button" className={quizChoice === "no" ? `selected ${quizIsCorrect ? "correct" : ""}` : ""} onClick={() => setQuizChoice("no")}><b>X</b><span>{feedback.falseLabel}</span></button></div>
        </section>
        {quizChoice && <section className={quizIsCorrect ? "quiz-answer correct" : "quiz-answer"}><span aria-hidden="true">{quizIsCorrect ? "🎉" : "💡"}</span><div><strong>{quizIsCorrect ? feedback.correct : feedback.wrong} <i>{feedback.answer}: {quiz.answer ? "O" : "X"}</i></strong><p>{quiz.explanation}</p></div></section>}
        <button className="quiz-next-button secondary-quiz-button" type="button" onClick={nextQuestion}><span className="quiz-repeat-icon" aria-hidden="true">↻</span><span>{navigationCopy[lang].anotherQuiz}</span><ArrowIcon /></button>
        {quizChoice && <button className="quiz-continue-button quiz-continue-card" type="button" onClick={onChew}><img className="quiz-continue-photo" src="/alternative-chew.png" alt="장난감을 물어뜯는 강아지" /><span className="quiz-continue-copy"><small>{lang === "ko" ? "다음 추천" : lang === "en" ? "NEXT PICK" : lang === "zh" ? "下一项推荐" : "次のおすすめ"}</small><strong>{navigationCopy[lang].quizContinue}</strong></span><ArrowIcon /></button>}
      </main>
      <BottomNav lang={lang} current="quiz" onHome={onHome} onGuide={onGuide} onQuiz={nextQuestion} onChew={onChew} onProduct={onProduct} onProgram={onProgram} />
    </div>
  );
}

function GuideScreen({ lang, onLangChange, breed, petName, caseId, onBack, onHome, onReselectBreed, onQuiz, onChew, onProduct, onProgram, onTemperamentResult, onTrack }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; caseId: string; onBack: () => void; onHome: () => void; onReselectBreed: () => void; onQuiz: () => void; onChew: () => void; onProduct: () => void; onProgram: () => void; onTemperamentResult: (value: string) => void; onTrack: TrackFunnel }) {
  const t = copy[lang];
  const f = funnelCopy[lang];
  const x = experienceCopy[lang];
  const temperament = temperamentText[lang];
  const nextStep = nextStepCopy[lang];
  const totalQuestions = temperament.items.length;
  const [scores, setScores] = useState<(number | null)[]>(() => Array(totalQuestions).fill(null));
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showActionPage, setShowActionPage] = useState(false);
  const [openActionIndex, setOpenActionIndex] = useState(0);
  const name = petDisplayName(breed, lang, petName);
  const answered = scores.filter((score) => score !== null).length;
  const complete = answered === totalQuestions;
  const result = calculateTemperamentProfile(scores.map((score) => score ?? 0), lang);
  const reset = () => {
    setScores(Array(totalQuestions).fill(null));
    setActiveQuestion(0);
    setShowResult(false);
    setShowActionPage(false);
    onTemperamentResult("");
    window.localStorage.removeItem("bittercare-temperament-result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const revealResult = () => {
    const resultPayload = { character: result.name, code: result.code, mbtiStyle: result.mbtiStyle, hook: result.hook, description: result.description, top3: result.topAxes, axes: result.axisScores };
    const value = JSON.stringify(resultPayload);
    onTemperamentResult(value);
    window.localStorage.setItem("bittercare-temperament-result", value);
    void saveAssessment({ caseId, assessmentType: "temperament", breed: breed.key, petName, language: lang, answers: scores, result: resultPayload }).catch(() => undefined);
    onTrack("temperament_complete", "temperament_result");
    setShowResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const revealActionPage = () => { setShowActionPage(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const closeActionPage = () => { setShowActionPage(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const answerTemperament = (score: number) => {
    setScores((previous) => previous.map((value, index) => index === activeQuestion ? score : value));
    if (activeQuestion < totalQuestions - 1) {
      window.setTimeout(() => setActiveQuestion((question) => Math.min(totalQuestions - 1, question + 1)), 180);
    }
  };

  if (showActionPage) {
    return (
      <div className="screen guide-screen action-guide-screen">
        <header className="step-header guide-header"><button className="back-button" type="button" onClick={closeActionPage} aria-label={t.aria.back}>←</button><Brand lang={lang} onClick={onHome} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
        <main>
          <section className="action-page-hero">
            <div><small>{x.actionPageBadge}</small><h1>{x.actionPageTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><p>{x.actionPageLead}</p></div>
            <div className="action-page-dog"><BreedPortrait breed={breed} lang={lang} /></div>
          </section>

          <section className={`action-profile-strip type-${result.coreKey}`}>
            <span aria-hidden="true">{result.emoji}</span><div><small>{name} · {f.resultLabel}</small><strong>{result.name}</strong><p>{result.hook}</p></div>
          </section>

          <section className="action-page-plan">
            <div className="action-page-intro"><span aria-hidden="true">👆</span><div><strong>{lang === "ko" ? "한 번에 하나씩 해보세요" : x.planRevealTitle}</strong><p>{lang === "ko" ? "카드를 눌러 오늘 실천할 방법만 가볍게 확인해보세요." : x.planRevealBody}</p></div></div>
            <div className="action-page-list">{result.actions.map(([title, body], index) => {
              const expanded = openActionIndex === index;
              const icons = ["🎯", "👣", "✨"];
              return <article key={title} className={expanded ? "expanded" : ""}>
                <button type="button" aria-expanded={expanded} onClick={() => setOpenActionIndex(expanded ? -1 : index)}>
                  <b aria-hidden="true">{icons[index % icons.length]}</b><div><small>STEP {index + 1}</small><strong>{title}</strong></div><span aria-hidden="true">{expanded ? "−" : "+"}</span>
                </button>
                {expanded && <p>{body}</p>}
              </article>;
            })}</div>
          </section>

          <p className="result-safety action-safety">{f.safety}</p>
          <button className="back-to-result-button" type="button" onClick={closeActionPage}>← {x.backToResult}</button>

          <section className="temperament-next-step action-last-card">
            <div><small>{nextStep.badge}</small><h2>{nextStep.title}</h2><p>{nextStep.body}</p></div>
            <img src="/nav-chew-v30.png" alt="" aria-hidden="true" />
            <button type="button" onClick={onChew}>{nextStep.cta} <ArrowIcon /></button>
          </section>
          <section className="quiz-flow-card secondary-content-card">
            <div><small>{nextStep.quizBadge}</small><h2>{navigationCopy[lang].quizGo}</h2><p>{f.quizHint}</p></div>
            <img src="/nav-quiz-v30.png" alt="" aria-hidden="true" />
            <button type="button" onClick={onQuiz}>{navigationCopy[lang].quizGo} <ArrowIcon /></button>
          </section>
        </main>
        <BottomNav lang={lang} current="guide" onHome={onHome} onGuide={closeActionPage} onQuiz={onQuiz} onChew={onChew} onProduct={onProduct} onProgram={onProgram} />
      </div>
    );
  }

  return (
    <div className="screen guide-screen focused-check">
      <header className="step-header guide-header"><button className="back-button" type="button" onClick={onBack} aria-label={t.aria.back}>←</button><Brand lang={lang} onClick={onHome} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
      <main>
        {!showResult && <><section className="temperament-hero compact">
          <div><small>{f.traitBadge}</small><h1>{name}<br />{temperament.checkTitle}</h1><p>{f.promise}</p></div>
          <div className="temperament-dog"><BreedPortrait breed={breed} lang={lang} /></div>
        </section>
        <div className="selected-breed-confirm"><div className="selected-breed-mini"><BreedPortrait breed={breed} lang={lang} /></div><div><small>{f.resultLabel}</small><strong>{name}</strong></div><button type="button" onClick={onReselectBreed}>{x.reselectBreed}</button></div>
        <div className="check-progress"><div><span>{f.progress}</span><strong>{answered} / {totalQuestions}</strong></div><i><b style={{ width: `${(answered / totalQuestions) * 100}%` }} /></i></div>
        <section className="temperament-check focused">
          <div className="temperament-items single-question">
            <fieldset key={temperament.items[activeQuestion][0]} aria-labelledby={`temperament-question-${activeQuestion}`}>
              <div className="question-copy" id={`temperament-question-${activeQuestion}`}><strong><i>{activeQuestion + 1}</i>{temperament.items[activeQuestion][0]}</strong></div>
              <div className="score-row">
                {temperament.scale.map((label, score) => <button key={label} className={scores[activeQuestion] === score ? "selected" : ""} type="button" onClick={() => answerTemperament(score)} aria-label={`${temperament.items[activeQuestion][0]}: ${label}`}><b>{score}</b><small>{label}</small></button>)}
              </div>
            </fieldset>
            <div className="single-question-controls auto-advance">
              <button type="button" onClick={() => setActiveQuestion((value) => Math.max(0, value - 1))} disabled={activeQuestion === 0}>← {lang === "ko" ? "이전" : lang === "en" ? "Previous" : lang === "zh" ? "上一题" : "前へ"}</button>
              <span>{activeQuestion + 1} / {totalQuestions}</span>
            </div>
          </div>
        </section>
        {complete && <button className="result-start-button" type="button" onClick={revealResult}>{x.resultCta} <ArrowIcon /></button>}
        </>}

        {showResult && <div className="result-reveal">
          <section className={`v55-result-hero type-${result.coreKey}`}>
            <div className="v55-result-celebrate"><img src="/home-v49-ref-paw.png" alt="" aria-hidden="true" /><div><small>{lang === "ko" ? "검사 완료!" : lang === "en" ? "CHECK COMPLETE!" : lang === "zh" ? "测试完成！" : "チェック完了！"}</small><p>{lang === "ko" ? "우리 강아지의 성향을 확인했어요" : lang === "en" ? "We found your dog’s personality style" : lang === "zh" ? "已确认爱犬的性格倾向" : "愛犬の性格傾向がわかりました"}</p></div><img src="/home-v49-ref-heart.png" alt="" aria-hidden="true" /></div>
            <div className="v55-result-profile"><div className="v55-result-photo"><BreedPortrait breed={breed} lang={lang} /></div><div className="v55-result-main"><small>{result.name}</small><strong>{result.mbtiStyle}</strong><span>{result.code} · BITTERCARE TYPE</span><p>{result.hook}</p></div></div>
            <p className="v55-result-description">{result.description}</p>
            <p className="v55-mbti-note">{lang === "ko" ? "MBTI STYLE은 강아지의 행동 성향을 재미있게 보여주는 캐릭터 표현이며, 사람 MBTI 검사와는 다릅니다." : temperament.notDiagnosis}</p>
          </section>
          <section className="v55-score-panel">
            <div className="v55-score-heading"><div><small>{lang === "ko" ? "오늘의 결과" : f.resultLabel}</small><h2>{lang === "ko" ? "4가지 핵심 성향" : temperament.result}</h2></div><img src="/home-v49-ref-paw.png" alt="" aria-hidden="true" /></div>
            <div className="v55-score-grid">{temperamentAxisOrder.map((axis, index) => <article key={axis}><img src={["/home-v49-ref-extra-analysis.png", "/home-v49-ref-extra-solution.png", "/home-v49-ref-extra-howto.png", "/home-v49-ref-extra-report.png"][index]} alt="" aria-hidden="true" /><small>{temperamentAxisLabels[axis][lang]}</small><strong>{temperamentAxisLevel(result.axisScores[axis], lang)}</strong><div className="v59-trait-meter" aria-label={`${temperamentAxisLabels[axis][lang]} ${temperamentAxisLevel(result.axisScores[axis], lang)}`}><i style={{ width: `${result.axisScores[axis]}%` }} /></div><p>{result.axisTones[axis]}</p></article>)}</div>
            <div className="v55-personal-tip"><img src="/home-v49-ref-tip-dog.png" alt="" aria-hidden="true" /><div><small>{lang === "ko" ? `${name} 맞춤 팁` : "PERSONAL TIP"}</small><strong>{result.actions[0][0]}</strong><p>{result.actions[0][1]}</p></div></div>
          </section>
          <ResultShareButtons lang={lang} kind="temperament" breed={breed} petName={petName} title={result.name} hook={result.hook} description={result.description} mbti={result.mbtiStyle} axes={temperamentAxisOrder.map((axis) => ({ label: temperamentAxisLabels[axis][lang], score: result.axisScores[axis], level: temperamentAxisLevel(result.axisScores[axis], lang) }))} onTrack={onTrack} />
          <button className="reset-check reset-after-result" type="button" onClick={reset}>{f.reset}</button>

          <section className="action-plan-invite result-action-first"><small>{x.planBadge}</small><h2>{x.planRevealTitle}</h2><p>{x.planRevealBody}</p><button type="button" onClick={revealActionPage}>{x.planRevealCta} <ArrowIcon /></button></section>

          <section className="temperament-next-step result-next-step"><div><small>{nextStep.badge}</small><h2>{nextStep.title}</h2><p>{nextStep.body}</p></div><img src="/nav-chew-v30.png" alt="" aria-hidden="true" /><button type="button" onClick={onChew}>{nextStep.cta} <ArrowIcon /></button></section>

          <p className="research-reference-note"><span aria-hidden="true">⌁</span>{researchReferenceNote[lang]}</p>

          <p className="result-safety result-safety-before-quiz">{f.safety}</p>
          <button className="quiz-go-button animated-quiz-cta secondary-quiz-entry" type="button" onClick={onQuiz}>{navigationCopy[lang].quizGo} <ArrowIcon /></button>
        </div>}
      </main>
      <BottomNav lang={lang} current="guide" onHome={onHome} onGuide={() => {}} onQuiz={onQuiz} onChew={onChew} onProduct={onProduct} onProgram={onProgram} />
    </div>
  );
}

function ProgramGateScreen({ lang, onLangChange, breed, petName, onBack, onHome, onGuide, onQuiz, onChew, onProduct, onProgram }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; onBack: () => void; onHome: () => void; onGuide: () => void; onQuiz: () => void; onChew: () => void; onProduct: () => void; onProgram: () => void }) {
  const n = navigationCopy[lang];
  const d = threeDayCopy[lang];
  const choices = programGateChoiceCopy[lang];
  return <div className="screen program-gate-screen">
    <header className="step-header guide-header"><button className="back-button" type="button" onClick={onBack} aria-label={n.previous}>←</button><Brand lang={lang} onClick={onHome} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
    <main>
      <section className="program-gate-card">
        <small>{d.gateBadge}</small>
        <div className="program-gate-dog"><BreedPortrait breed={breed} lang={lang} /></div>
        <strong className="program-gate-pet-name">{petDisplayName(breed, lang, petName)}</strong>
        <h1>{n.gateTitle}</h1><p>{d.gateBody}</p>
        <div className="gate-photo-preview">{photoChallengeCopy[lang].days.map((day, index) => <span key={day}><b>{index + 1}</b>{day.split("\n")[0]}</span>)}</div>
        <div className="gate-photo-tip">{photoChallengeCopy[lang].tip}</div>
        <div className="gate-start-panel gate-choice-panel">
          <div><small>BITTERCARE · 3 DAY</small><button className="gate-program-button" type="button" onClick={onProgram}>{choices.using} <ArrowIcon /></button><button className="gate-product-button" type="button" onClick={onProduct}>{choices.before} <ArrowIcon /></button></div>
          <div className="gate-brand-art" aria-hidden="true"><img src="/bittercare-dog-mark-v2.jpg" alt="" /></div>
        </div>
        <button className="gate-chew-link gate-chew-link-card" type="button" onClick={onChew}>
          <img src="/alternative-chew.png" alt="" aria-hidden="true" />
          <span><small>{lang === "ko" ? "먼저 확인" : lang === "en" ? "CHECK FIRST" : lang === "zh" ? "先确认类型" : "まずタイプ確認"}</small><strong>{choices.chew}</strong></span>
          <ArrowIcon />
        </button>
      </section>
    </main>
    <BottomNav lang={lang} current="program" onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={onChew} onProgram={onProgram} showDiaryPreview={false} />
  </div>;
}

function ProgramScreen({ lang, onLangChange, breed, petName, caseId, targetLabel, temperamentResult, onHome, onGuide, onQuiz, onChew, onProduct }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; caseId: string; targetLabel: string; temperamentResult: string; onHome: () => void; onGuide: () => void; onQuiz: () => void; onChew: () => void; onProduct: () => void }) {
  const t = copy[lang];
  const d = threeDayCopy[lang];
  const o = observationCopy[lang];
  const name = petDisplayName(breed, lang, petName);
  const emptyObservation = { approachCount: "", chewed: "", bitterReaction: "", adhesion: "" };
  const [selectedDay, setSelectedDay] = useState(1);
  const [entries, setEntries] = useState<Record<number, DiaryEntry>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [observations, setObservations] = useState<Record<number, typeof emptyObservation>>({});
  const [comparison, setComparison] = useState("");
  const [extended, setExtended] = useState(false);
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!caseId) return;
    fetch(`/api/diary?caseId=${encodeURIComponent(caseId)}`).then((res) => res.ok ? res.json() : Promise.reject()).then((data: { entries: DiaryEntry[] }) => {
      const next: Record<number, DiaryEntry> = {};
      const nextNotes: Record<number, string> = {};
      const nextObservations: Record<number, typeof emptyObservation> = {};
      data.entries.filter((entry) => entry.day <= 5).forEach((entry) => {
        next[entry.day] = entry; nextNotes[entry.day] = entry.note;
        nextObservations[entry.day] = { approachCount: entry.approachCount, chewed: entry.chewed, bitterReaction: entry.bitterReaction, adhesion: entry.adhesion };
        if (entry.day === 3 && entry.comparison) setComparison(entry.comparison);
        if (entry.day > 3) setExtended(true);
      });
      setEntries(next); setNotes(nextNotes); setObservations(nextObservations);
    }).catch(() => undefined);
  }, [caseId]);

  const completed = Object.keys(entries).length;
  const currentEntry = entries[selectedDay];
  const currentPreview = previews[selectedDay] || currentEntry?.photoUrl || "";
  const currentObservation = observations[selectedDay] || emptyObservation;
  const totalDays = extended ? 5 : 3;
  const extraObservation = extraObservationCopy[lang];
  const dayCopy = selectedDay <= 3 ? d.days[selectedDay - 1] : [`DAY ${selectedDay}`, extraObservation[0], extraObservation[1]];
  const readyToSave = Boolean(currentPreview && currentObservation.approachCount && currentObservation.chewed && currentObservation.bitterReaction && currentObservation.adhesion && (selectedDay !== 3 || comparison));

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const original = input.files?.[0];
    if (!original) return;
    const file = await compressDiaryPhoto(original);
    if (previews[selectedDay]) URL.revokeObjectURL(previews[selectedDay]);
    setFiles((prev) => ({ ...prev, [selectedDay]: file }));
    setPreviews((prev) => ({ ...prev, [selectedDay]: URL.createObjectURL(file) }));
    setStatus("idle");
    input.value = "";
  }

  async function postEntry(day: number, helpRequested = false) {
    const observation = observations[day] || entries[day] || emptyObservation;
    const form = new FormData();
    form.set("caseId", caseId); form.set("day", String(day)); form.set("breed", breed.key);
    form.set("note", notes[day] || entries[day]?.note || ""); form.set("comparison", day === 3 ? comparison || entries[3]?.comparison || "" : "");
    form.set("approachCount", observation.approachCount); form.set("chewed", observation.chewed); form.set("bitterReaction", observation.bitterReaction); form.set("adhesion", observation.adhesion);
    form.set("petName", petName); form.set("target", targetLabel); form.set("temperamentResult", temperamentResult); form.set("helpRequested", String(helpRequested));
    if (files[day]) form.set("photo", files[day]!);
    const response = await fetch("/api/diary", { method: "POST", body: form });
    if (!response.ok) throw new Error("save failed");
    return (await response.json() as { entry: DiaryEntry }).entry;
  }

  async function saveEntry() {
    if (!caseId || !readyToSave) return;
    setStatus("saving");
    try {
      const entry = await postEntry(selectedDay);
      setEntries((prev) => ({ ...prev, [selectedDay]: entry }));
      setFiles((prev) => ({ ...prev, [selectedDay]: null }));
      setStatus("saved");
    } catch { setStatus("error"); }
  }

  async function requestHelp() {
    try {
      const entry = await postEntry(3, true);
      setEntries((previous) => ({ ...previous, 3: entry }));
    } catch { setStatus("error"); }
  }

  const approachRank: Record<string, number> = { "0": 0, "1-2": 1, "3-5": 2, "6+": 3 };
  const dayOne = entries[1];
  const dayThree = entries[3];
  const approachImproved = Boolean(dayOne && dayThree && approachRank[dayThree.approachCount] < approachRank[dayOne.approachCount]);
  const strongAvoidance = Boolean(dayThree && ["avoid", "pause"].includes(dayThree.bitterReaction));
  const applicationProblem = Boolean(dayThree && (dayThree.adhesion === "loose" || dayThree.bitterReaction === "none"));
  const reportKind = comparison === "worse" || (dayThree?.chewed === "yes" && applicationProblem)
    ? "worse"
    : comparison === "much" || (approachImproved && dayThree?.chewed === "no" && strongAvoidance)
      ? "good"
      : comparison === "little" || approachImproved || dayThree?.chewed === "try"
        ? "better"
        : "same";
  const reportText = {
    ko: { good: ["🎉 좋은 변화가 보여요", "접근과 물어뜯기가 줄었다면 3일 기록을 마치고 현재 상태를 유지해주세요."], better: ["🐶 변화가 진행 중이에요", "접근은 줄었지만 아직 시도한다면 원할 때 2~3일 더 관찰해보세요."], same: ["🔍 사용 상태를 한번 확인해볼까요?", "부착 범위와 들뜸을 확인하고 다시 붙인 뒤 반응을 살펴보세요."], worse: ["⚠️ 조금 더 확인이 필요해요", "계속 물어뜯거나 회피 반응이 없다면 기록과 사진을 함께 보내 도움을 받아보세요."] },
    en: { good: ["🎉 A good change is showing", "Finish the 3-day log and maintain the current setup."], better: ["🐶 Change is in progress", "You can observe for 2–3 more days."], same: ["🔍 Let’s check the setup", "Review coverage and loose edges, then observe again."], worse: ["⚠️ A closer look is needed", "Send your photos and records to BitterCare for help."] },
    zh: { good: ["🎉 看到了良好变化", "完成3天记录并保持当前状态。"], better: ["🐶 变化正在进行", "可以选择再观察2~3天。"], same: ["🔍 检查一下使用状态", "确认覆盖范围和翘边，重新粘贴后继续观察。"], worse: ["⚠️ 需要进一步确认", "将照片和记录发送给BitterCare获取帮助。"] },
    ja: { good: ["🎉 良い変化が見えます", "3日記録を終え、今の状態を維持しましょう。"], better: ["🐶 変化の途中です", "必要ならあと2〜3日観察できます。"], same: ["🔍 貼り方を確認しましょう", "範囲と浮きを直してもう一度観察します。"], worse: ["⚠️ もう少し確認が必要です", "写真と記録をBitterCareへ送って相談できます。"] },
  }[lang][reportKind];

  return <div className="screen program-screen">
    <header className="step-header program-header"><button className="back-button" type="button" onClick={onChew} aria-label={t.aria.back}>←</button><div className="program-header-copy"><small>{t.program.customer}</small><strong>{d.header}</strong></div><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
    <main>
      <section className="program-hero"><div><small>{lang === "en" ? `${t.program.withDog} ${name}` : `${name}${t.program.withDog}`}</small><h1>{d.hero.split("\n").map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h1></div><div className="program-ring"><strong>{completed}</strong><span>/ {totalDays} DAYS</span></div></section>
      <div className="diary-intro"><div><strong>{d.introTitle}</strong><p>{d.introDesc}</p></div><span>{completed}/{totalDays} {d.progress}</span></div>
      <section className="day-tabs three-day-tabs">{Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => <button key={day} className={selectedDay === day ? "active" : entries[day] ? "done" : ""} type="button" onClick={() => { setSelectedDay(day); setStatus("idle"); }}><strong>{day}</strong>{entries[day] && <i>✓</i>}</button>)}</section>
      <section className="diary-editor">
        <div className="diary-day-heading"><span>{dayCopy[0]}</span><div><h2>{dayCopy[1]}</h2><p>{dayCopy[2]}</p></div></div>
        <div className="shooting-tips">{photoChallengeCopy[lang].uploadTips.map((tip) => <span key={tip}>{tip}</span>)}</div>
        <label className={currentPreview ? "photo-uploader has-photo" : "photo-uploader"}>{currentPreview ? <img src={currentPreview} alt={t.program.photoSaved} /> : <><span>＋</span><strong>{t.program.camera}</strong><small>JPG · PNG · HEIC</small></>}<input type="file" accept="image/*" capture="environment" onChange={handlePhoto} aria-label={t.aria.upload} />{currentPreview && <i>{t.program.replace}</i>}</label>
        {currentPreview && <p className="photo-ready-message">✓ {photoChallengeCopy[lang].ready}</p>}
        <div className="observation-fields">{[{ key: "approachCount", copy: o.approach }, { key: "chewed", copy: o.chewed }, { key: "bitterReaction", copy: o.reaction }, { key: "adhesion", copy: o.adhesion }].map((field, index) => <fieldset key={field.key}><legend><b>{index + 1}</b>{field.copy[0]}</legend><div>{field.copy[1].map(([value, label]) => <button key={value} type="button" className={currentObservation[field.key as keyof typeof currentObservation] === value ? "selected" : ""} onClick={() => { setObservations((previous) => ({ ...previous, [selectedDay]: { ...currentObservation, [field.key]: value } })); setStatus("idle"); }}>{label}</button>)}</div></fieldset>)}</div>
        <textarea value={notes[selectedDay] || ""} onChange={(event) => setNotes((prev) => ({ ...prev, [selectedDay]: event.target.value }))} placeholder={t.program.notePlaceholder} maxLength={500} />
        {selectedDay === 3 && <fieldset className="change-check"><legend><strong>{d.compareTitle}</strong><span>{d.compareLead}</span></legend><div>{d.compareOptions.map(([value, label]) => <button key={value} className={comparison === value ? "selected" : ""} type="button" onClick={() => { setComparison(value); setStatus("idle"); }}>{label}</button>)}</div>{!comparison && <p>{d.compareRequired}</p>}</fieldset>}
        {!readyToSave && <p className="observation-required">{o.required}</p>}
        <button className="save-diary-button" type="button" onClick={saveEntry} disabled={status === "saving" || !readyToSave}>{status === "saving" ? t.program.saving : t.program.save}<ArrowIcon /></button>
        {status === "saved" && <p className="save-message success">✓ {t.program.saved}</p>}{status === "error" && <p className="save-message error">! {t.program.error}</p>}
      </section>
      {entries[3] && <section className={`auto-report report-${reportKind}`}><small>{o.report}</small><h2>{reportText[0]}</h2><p>{reportText[1]}</p><div className="report-signal-grid"><span><b>{o.reportLabels[0]}</b><strong>{entries[1]?.approachCount || "-"} → {entries[3].approachCount}</strong></span><span><b>{o.reportLabels[1]}</b><strong>{entries[3].chewed === "no" ? "↓" : entries[3].chewed === "try" ? "△" : "→"}</strong></span><span><b>{o.reportLabels[2]}</b><strong>{["avoid", "pause"].includes(entries[3].bitterReaction) ? "✓" : "△"}</strong></span><span><b>{o.reportLabels[3]}</b><strong>{entries[3].adhesion === "good" ? "✓" : "!"}</strong></span></div>{reportKind === "better" && !extended && <button type="button" onClick={() => { setExtended(true); setSelectedDay(4); }}>{o.extend} <ArrowIcon /></button>}{reportKind === "same" && <button type="button" onClick={onProduct}>{o.reapply} <ArrowIcon /></button>}{["same", "worse"].includes(reportKind) && <button className="help-request-button" type="button" onClick={requestHelp} disabled={entries[3].helpRequested}>{entries[3].helpRequested ? o.helpDone : o.help}</button>}</section>}
      <p className="privacy-note"><span>●</span>{t.program.privacy}</p>
    </main>
    <BottomNav lang={lang} current="program" onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={onChew} onProgram={() => window.scrollTo({ top: 0, behavior: "smooth" })} showDiaryPreview={false} />
  </div>;
}

const reportScreenCopy = {
  ko: { complete: "3일 기록이 완성됐어요 🎉", completeLead: "3일 동안 기록한 변화를 한눈에 확인해보세요.", title: "3일 변화 리포트", photos: "DAY 1 · 2 · 3 사진 비교", noPhoto: "사진 없음", metrics: ["보호 부위 접근", "물어뜯기 시도", "쓴맛 반응", "부착 상태"], results: { positive: "긍정적인 변화", partial: "일부 변화", observe: "조금 더 관찰", application: "사용 방법 확인" }, photoNotice: "사진은 3일간의 상태를 직접 비교하기 위한 기록이며 자동 분석 결과에는 사용되지 않습니다.", same: "같은 장소 다시 3일 관찰하기", newPlace: "새로운 장소 기록하기", history: "지난 기록", home: "홈으로", save: "리포트 저장하기", active: "진행 중인 기록", today: "오늘 기록하기", newStart: "+ 새로운 3일 기록 시작", start: "3일 관찰 시작", location: "관찰할 장소", report: "리포트 보기", dayProgress: "일차", empty: "아직 지난 기록이 없어요.", trend: { decrease: "감소 ↓", same: "비슷 →", increase: "증가 ↑", confirmed: "반응 확인", weak: "약한 반응", none: "반응 없음", good: "양호", check: "확인 필요" } },
  en: { complete: "Your 3-day log is complete 🎉", completeLead: "See the three-day change at a glance.", title: "3-day change report", photos: "DAY 1 · 2 · 3 photo comparison", noPhoto: "No photo", metrics: ["Approach", "Chewing attempts", "Bitter response", "Adhesion"], results: { positive: "Positive change", partial: "Some change", observe: "Observe a little longer", application: "Check application" }, photoNotice: "Photos are for your own three-day comparison and are not used in the automatic result.", same: "Observe the same place again", newPlace: "Record a new place", history: "Past records", home: "Home", save: "Save report", active: "In progress", today: "Record today", newStart: "+ Start a new 3-day log", start: "Start 3-day observation", location: "Observation target", report: "View report", dayProgress: "day", empty: "No past records yet.", trend: { decrease: "Decrease ↓", same: "Similar →", increase: "Increase ↑", confirmed: "Confirmed", weak: "Weak", none: "None", good: "Good", check: "Check" } },
  zh: { complete: "3天记录已完成 🎉", completeLead: "一眼查看3天的变化。", title: "3天变化报告", photos: "第1·2·3天照片对比", noPhoto: "无照片", metrics: ["接近保护部位", "啃咬尝试", "苦味反应", "粘贴状态"], results: { positive: "积极变化", partial: "部分变化", observe: "继续观察", application: "检查使用方法" }, photoNotice: "照片仅用于您直接比较3天状态，不参与自动结果计算。", same: "同一地点再观察3天", newPlace: "记录新地点", history: "历史记录", home: "主页", save: "保存报告", active: "进行中的记录", today: "记录今天", newStart: "+ 开始新的3天记录", start: "开始3天观察", location: "观察地点", report: "查看报告", dayProgress: "天", empty: "暂无历史记录。", trend: { decrease: "减少 ↓", same: "相近 →", increase: "增加 ↑", confirmed: "已确认", weak: "较弱", none: "无反应", good: "良好", check: "需确认" } },
  ja: { complete: "3日間の記録が完成しました 🎉", completeLead: "3日間の変化をひと目で確認しましょう。", title: "3日変化レポート", photos: "DAY 1・2・3 写真比較", noPhoto: "写真なし", metrics: ["保護部分への接近", "噛む試み", "苦味反応", "密着状態"], results: { positive: "良い変化", partial: "一部に変化", observe: "もう少し観察", application: "貼り方を確認" }, photoNotice: "写真は3日間の状態をご自身で比較する記録で、自動判定には使用しません。", same: "同じ場所をもう一度3日観察", newPlace: "新しい場所を記録", history: "過去の記録", home: "ホーム", save: "レポートを保存", active: "進行中の記録", today: "今日を記録", newStart: "+ 新しい3日記録を開始", start: "3日観察を開始", location: "観察する場所", report: "レポートを見る", dayProgress: "日目", empty: "過去の記録はまだありません。", trend: { decrease: "減少 ↓", same: "同程度 →", increase: "増加 ↑", confirmed: "反応あり", weak: "弱い反応", none: "反応なし", good: "良好", check: "要確認" } },
} as const;

function ProgramScreenV58({ lang, onLangChange, breed, petName, caseId, dogAge, targetLabel, targetOptions, temperamentResult, onHome, onGuide, onQuiz, onChew, onProduct }: { lang: Lang; onLangChange: (lang: Lang) => void; breed: Breed; petName: string; caseId: string; dogAge: string; targetLabel: string; targetOptions: readonly string[]; temperamentResult: string; onHome: () => void; onGuide: () => void; onQuiz: () => void; onChew: () => void; onProduct: () => void }) {
  const t = copy[lang];
  const d = threeDayCopy[lang];
  const o = observationCopy[lang];
  const r = reportScreenCopy[lang];
  const name = petDisplayName(breed, lang, petName);
  const emptyObservation = { approachCount: "", chewed: "", bitterReaction: "", adhesion: "" };
  const [sessions, setSessions] = useState<ObservationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewReportId, setViewReportId] = useState("");
  const [newTarget, setNewTarget] = useState(targetLabel);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [observations, setObservations] = useState<Record<number, typeof emptyObservation>>({});
  const [comparison, setComparison] = useState("");
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const creatingRef = useRef(false);

  const loadSessions = useCallback(async () => {
    if (!caseId) return [] as ObservationSession[];
    const response = await fetch(`/api/program?caseId=${encodeURIComponent(caseId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("load failed");
    const data = await response.json() as { sessions: ObservationSession[] };
    setSessions(data.sessions);
    return data.sessions;
  }, [caseId]);

  const createSession = useCallback(async (target: string) => {
    if (!caseId || creatingRef.current) return;
    creatingRef.current = true;
    setStatus("saving");
    try {
      const form = new FormData();
      form.set("action", "create_session"); form.set("caseId", caseId); form.set("breed", breed.key); form.set("petName", petName); form.set("dogAge", dogAge); form.set("target", target); form.set("temperamentResult", temperamentResult); form.set("language", lang);
      const response = await fetch("/api/program", { method: "POST", body: form });
      if (!response.ok) throw new Error("create failed");
      const data = await response.json() as { session: { id: string } };
      await loadSessions();
      setActiveSessionId(data.session.id); setSelectedDay(1); setViewReportId(""); setNotes({}); setObservations({}); setComparison(""); setStatus("idle");
    } catch { setStatus("error"); } finally { creatingRef.current = false; }
  }, [breed.key, caseId, dogAge, lang, loadSessions, petName, temperamentResult]);

  useEffect(() => {
    let cancelled = false;
    if (!caseId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions().then((loaded) => {
      if (cancelled) return;
      const active = loaded.find((session) => session.status === "active");
      if (active) {
        setActiveSessionId(active.id);
        const nextDay = Math.min(3, active.entries.length + 1);
        setSelectedDay(nextDay);
        const entryMap: Record<number, typeof emptyObservation> = {};
        const noteMap: Record<number, string> = {};
        active.entries.forEach((entry) => { entryMap[entry.day] = { approachCount: entry.approachCount, chewed: entry.chewed, bitterReaction: entry.bitterReaction, adhesion: entry.adhesion }; noteMap[entry.day] = entry.note; if (entry.day === 3) setComparison(entry.comparison); });
        setObservations(entryMap); setNotes(noteMap); setStatus("idle");
      } else {
        // V59: entering the 3-day log must always surface DAY 1–3.
        // Completed/archive sessions stay below; they must never replace the active editor.
        setViewReportId("");
        void createSession(targetLabel);
      }
    }).catch(() => setStatus("error"));
    return () => { cancelled = true; };
  }, [caseId, createSession, loadSessions, targetLabel]);

  const activeSession = sessions.find((session) => session.id === activeSessionId && session.status === "active") ?? null;
  const reportSession = sessions.find((session) => session.report?.id === viewReportId) ?? null;
  const currentEntry = activeSession?.entries.find((entry) => entry.day === selectedDay);
  const currentPreview = previews[selectedDay] || currentEntry?.photoUrl || "";
  const currentObservation = observations[selectedDay] || (currentEntry ? { approachCount: currentEntry.approachCount, chewed: currentEntry.chewed, bitterReaction: currentEntry.bitterReaction, adhesion: currentEntry.adhesion } : emptyObservation);
  const dayCopy = d.days[selectedDay - 1];
  const readyToSave = Boolean(activeSession && currentPreview && currentObservation.approachCount && currentObservation.chewed && currentObservation.bitterReaction && currentObservation.adhesion && (selectedDay !== 3 || comparison));

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const original = input.files?.[0];
    if (!original) return;
    const file = await compressDiaryPhoto(original);
    if (previews[selectedDay]) URL.revokeObjectURL(previews[selectedDay]);
    setFiles((previous) => ({ ...previous, [selectedDay]: file }));
    setPreviews((previous) => ({ ...previous, [selectedDay]: URL.createObjectURL(file) }));
    setStatus("idle"); input.value = "";
  }

  async function saveEntry() {
    if (!activeSession || !readyToSave) return;
    setStatus("saving");
    try {
      const form = new FormData();
      form.set("action", "save_entry"); form.set("caseId", caseId); form.set("sessionId", activeSession.id); form.set("day", String(selectedDay)); form.set("note", notes[selectedDay] || currentEntry?.note || ""); form.set("comparison", selectedDay === 3 ? comparison : ""); form.set("approachCount", currentObservation.approachCount); form.set("chewed", currentObservation.chewed); form.set("bitterReaction", currentObservation.bitterReaction); form.set("adhesion", currentObservation.adhesion);
      if (files[selectedDay]) form.set("photo", files[selectedDay]!);
      const response = await fetch("/api/program", { method: "POST", body: form });
      if (!response.ok) throw new Error("save failed");
      const data = await response.json() as { report: ObservationReport | null };
      setFiles((previous) => ({ ...previous, [selectedDay]: null }));
      const loaded = await loadSessions();
      if (data.report) { setActiveSessionId(""); setViewReportId(data.report.id); }
      else setSelectedDay(Math.min(3, selectedDay + 1));
      if (!data.report && loaded.find((session) => session.id === activeSession.id)?.status === "completed") setViewReportId(loaded.find((session) => session.id === activeSession.id)?.report?.id ?? "");
      setStatus("saved"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setStatus("error"); }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat({ ko: "ko-KR", en: "en-US", zh: "zh-CN", ja: "ja-JP" }[lang], { month: "numeric", day: "numeric" }).format(new Date(value));
  const reportData = reportSession?.report?.data ?? {};
  const trendLabel = (value: unknown) => r.trend[String(value) as keyof typeof r.trend] ?? "-";
  const metricValues = reportSession ? [reportData.accessTrend, reportData.chewingTrend, reportData.bitterResponse, reportData.adhesionStatus] : [];
  const approachBars = Array.isArray(reportData.approach) ? reportData.approach as string[] : [];
  const approachRank: Record<string, number> = { "0": 8, "1-2": 35, "3-5": 66, "6+": 100 };

  if (reportSession?.report) {
    return <div className="screen program-screen report-screen">
      <header className="step-header program-header no-print"><button className="back-button" type="button" onClick={() => setViewReportId("")} aria-label={t.aria.back}>←</button><Brand lang={lang} onClick={onHome} /><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
      <main>
        <section className={`observation-report report-${reportSession.report.resultType}`}>
          <div className="report-brand"><strong>BitterCare</strong><span>{r.title}</span></div>
          <div className="report-summary"><small>{r.complete}</small><h1>{petName.trim() || name}</h1><p>{breedName(breed, lang)} · {reportSession.dogAge}<br />{reportSession.target}<br />{formatDate(reportSession.startedAt)} – {formatDate(reportSession.completedAt ?? reportSession.startedAt)}</p><b>{r.results[reportSession.report.resultType]}</b></div>
          <section className="report-photo-section"><h2>{r.photos}</h2><div>{[1, 2, 3].map((day) => { const entry = reportSession.entries.find((item) => item.day === day); return <figure key={day}><figcaption>DAY {day}</figcaption>{entry?.photoUrl ? <img src={entry.photoUrl} alt={`DAY ${day}`} /> : <span>{r.noPhoto}</span>}</figure>; })}</div><p>{r.photoNotice}</p></section>
          <section className="report-metrics"><h2>{r.completeLead}</h2><div>{r.metrics.map((label, index) => <article key={label}><span><b>{label}</b><strong>{trendLabel(metricValues[index])}</strong></span>{index === 0 ? <div className="report-bars">{[1, 2, 3].map((day, itemIndex) => <i key={day}><em>DAY {day}</em><b style={{ width: `${approachRank[approachBars[itemIndex]] ?? 8}%` }} /></i>)}</div> : <div className="metric-status-dot" data-status={String(metricValues[index] ?? "")}>●</div>}</article>)}</div></section>
          <section className="report-conclusion"><span aria-hidden="true">{reportSession.report.resultType === "positive" ? "🎉" : reportSession.report.resultType === "partial" ? "🐶" : reportSession.report.resultType === "application" ? "🔵" : "🟠"}</span><div><h2>{r.results[reportSession.report.resultType]}</h2><p>{reportSession.report.summary}</p></div></section>
        </section>
        <div className="report-actions no-print"><button type="button" onClick={() => window.print()}>{r.save}</button><button type="button" onClick={() => void createSession(reportSession.target)}>{r.same}</button><label><span>{r.newPlace}</span><select value={newTarget} onChange={(event) => setNewTarget(event.target.value)}>{targetOptions.map((target) => <option key={target}>{target}</option>)}</select><button type="button" onClick={() => void createSession(newTarget)}>{r.start} →</button></label><button className="secondary" type="button" onClick={() => setViewReportId("")}>{r.history}</button><button className="secondary" type="button" onClick={onHome}>{r.home}</button></div>
      </main>
      <BottomNav lang={lang} current="program" onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={onChew} onProgram={() => setViewReportId("")} showDiaryPreview={false} />
    </div>;
  }

  return <div className="screen program-screen session-program-screen">
    <header className="step-header program-header"><button className="back-button" type="button" onClick={onHome} aria-label={t.aria.back}>←</button><div className="program-header-copy"><small>{t.program.customer}</small><strong>{d.header}</strong></div><PetProfilePill breed={breed} petName={petName} lang={lang} onClick={onHome} /><LanguageMenu lang={lang} onChange={onLangChange} /></header>
    <main>
      {activeSession ? <>
        <section className="program-hero"><div><small>{lang === "en" ? `${t.program.withDog} ${name}` : `${name}${t.program.withDog}`}</small><h1>{d.hero.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><p>{activeSession.target}</p></div><div className="program-ring"><strong>{activeSession.entries.length}</strong><span>/ 3 DAYS</span></div></section>
        <section className="day-tabs three-day-tabs">{[1, 2, 3].map((day) => <button key={day} className={selectedDay === day ? "active" : activeSession.entries.some((entry) => entry.day === day) ? "done" : ""} type="button" onClick={() => { setSelectedDay(day); setStatus("idle"); }}><strong>{day}</strong>{activeSession.entries.some((entry) => entry.day === day) && <i>✓</i>}</button>)}</section>
        <section className="diary-editor">
          <div className="diary-day-heading"><span>{dayCopy[0]}</span><div><h2>{dayCopy[1]}</h2><p>{dayCopy[2]}</p></div></div>
          <div className="shooting-tips">{photoChallengeCopy[lang].uploadTips.map((tip) => <span key={tip}>{tip}</span>)}</div>
          <label className={currentPreview ? "photo-uploader has-photo" : "photo-uploader"}>{currentPreview ? <img src={currentPreview} alt={t.program.photoSaved} /> : <><span>＋</span><strong>{t.program.camera}</strong><small>JPG · PNG · HEIC</small></>}<input type="file" accept="image/*" capture="environment" onChange={handlePhoto} aria-label={t.aria.upload} />{currentPreview && <i>{t.program.replace}</i>}</label>
          <div className="observation-fields">{[{ key: "approachCount", copy: o.approach }, { key: "chewed", copy: o.chewed }, { key: "bitterReaction", copy: o.reaction }, { key: "adhesion", copy: o.adhesion }].map((field, index) => <fieldset key={field.key}><legend><b>{index + 1}</b>{field.copy[0]}</legend><div>{field.copy[1].map(([value, label]) => <button key={value} type="button" className={currentObservation[field.key as keyof typeof currentObservation] === value ? "selected" : ""} onClick={() => { setObservations((previous) => ({ ...previous, [selectedDay]: { ...currentObservation, [field.key]: value } })); setStatus("idle"); }}>{label}</button>)}</div></fieldset>)}</div>
          <textarea value={notes[selectedDay] ?? currentEntry?.note ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [selectedDay]: event.target.value }))} placeholder={t.program.notePlaceholder} maxLength={500} />
          {selectedDay === 3 && <fieldset className="change-check"><legend><strong>{d.compareTitle}</strong><span>{d.compareLead}</span></legend><div>{d.compareOptions.map(([value, label]) => <button key={value} className={comparison === value ? "selected" : ""} type="button" onClick={() => setComparison(value)}>{label}</button>)}</div>{!comparison && <p>{d.compareRequired}</p>}</fieldset>}
          {!readyToSave && <p className="observation-required">{o.required}</p>}
          <button className="save-diary-button" type="button" onClick={saveEntry} disabled={status === "saving" || !readyToSave}>{status === "saving" ? t.program.saving : t.program.save}<ArrowIcon /></button>
          {status === "saved" && <p className="save-message success">✓ {t.program.saved}</p>}{status === "error" && <p className="save-message error">! {t.program.error}</p>}
        </section>
      </> : status === "loading" || status === "saving" ? <section className="program-loading">BitterCare · 3 DAY</section> : status === "error" ? <section className="program-start-error"><span aria-hidden="true">🐾</span><div><strong>{lang === "ko" ? "3일 기록을 시작하지 못했어요." : "Could not start the 3-day log."}</strong><p>{lang === "ko" ? "네트워크 상태를 확인한 뒤 다시 시작해 주세요." : "Check your connection and try again."}</p><button type="button" onClick={() => void createSession(newTarget)}>{lang === "ko" ? "다시 시작하기" : "Try again"}</button></div></section> : null}
      <section className="program-history"><div className="program-history-heading"><div><small>BITTERCARE · ARCHIVE</small><h2>{r.history}</h2></div>{!activeSession && <button type="button" onClick={() => void createSession(newTarget)}>{r.newStart}</button>}</div>
        {sessions.filter((session) => session.status === "completed").length ? <div className="program-history-list">{sessions.filter((session) => session.status === "completed").map((session) => <button key={session.id} type="button" onClick={() => setViewReportId(session.report?.id ?? "")}><span>{session.target}<small>{formatDate(session.startedAt)} – {formatDate(session.completedAt ?? session.startedAt)}</small></span><strong>{session.report ? r.results[session.report.resultType] : r.title} →</strong></button>)}</div> : <p className="program-history-empty">{r.empty}</p>}
      </section>
      <p className="privacy-note"><span>●</span>{t.program.privacy}</p>
    </main>
    <BottomNav lang={lang} current="program" onHome={onHome} onGuide={onGuide} onQuiz={onQuiz} onChew={onChew} onProduct={onProduct} onProgram={() => window.scrollTo({ top: 0, behavior: "smooth" })} showDiaryPreview={false} />
  </div>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const [screen, setScreen] = useState<Screen>("home");
  const [breed, setBreed] = useState<Breed | null>(null);
  const [petName, setPetName] = useState("");
  const [age, setAge] = useState(1);
  const [target, setTarget] = useState(0);
  const [when, setWhen] = useState(1);
  const [chewAnswers, setChewAnswers] = useState<(number | null)[]>(() => Array(chewQuestions.length).fill(null));
  const [quizIndex, setQuizIndex] = useState(0);
  const [temperamentResult, setTemperamentResult] = useState("");
  const [programGateOrigin, setProgramGateOrigin] = useState<"home" | "chewPlan">("home");
  const [productOrigin, setProductOrigin] = useState<Screen>("chewPlan");
  const [breedPickerRequest, setBreedPickerRequest] = useState(0);
  const historyReadyRef = useRef(false);
  const handlingPopStateRef = useRef(false);
  const previousScreenRef = useRef<Screen>("home");
  const [caseId] = useState(() => {
    if (typeof window === "undefined") return "";
    const saved = window.localStorage.getItem("bittercare-case-id");
    if (saved) return saved;
    const id = typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `bc-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem("bittercare-case-id", id);
    return id;
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);
  const guideBreed = breed ?? popularBreeds[0];

  const trackFunnel = useCallback<TrackFunnel>((eventType, eventScreen, store, beacon = false) => {
    if (!caseId) return;
    const completedChew = chewAnswers.every((answer) => answer !== null);
    const chewType = eventType !== "chew_start" && completedChew
      ? calculateChewResult(chewAnswers.map((answer) => answer ?? 0), lang, age, when).title
      : "";
    void saveFunnelEvent({
      caseId,
      eventType,
      breed: guideBreed.key,
      petName,
      dogAge: copy[lang].ages[age],
      chewType,
      chewingTarget: copy[lang].targets[target],
      language: lang,
      screen: eventScreen,
      store,
    }, beacon);
  }, [age, caseId, chewAnswers, guideBreed.key, lang, petName, target, when]);

  useEffect(() => {
    if (!caseId) return;
    const visitKey = "bittercare-v57-visit-logged";
    if (window.sessionStorage.getItem(visitKey)) return;
    window.sessionStorage.setItem(visitKey, "1");
    trackFunnel("app_visit", "home");
  }, [caseId, trackFunnel]);

  useEffect(() => {
    const saved = window.localStorage.getItem("bittercare-language") as Lang | null;
    if (!saved || !languages.some((item) => item.key === saved)) return;
    const timer = window.setTimeout(() => setLang(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedBreed = window.localStorage.getItem("bittercare-breed") as BreedKey | null;
      if (savedBreed && [...popularBreeds.map((item) => item.key), ...moreBreedKeys].includes(savedBreed)) setBreed({ key: savedBreed });
      const savedName = window.localStorage.getItem("bittercare-pet-name");
      if (savedName) setPetName(savedName.slice(0, 12));
      const savedTemperament = window.localStorage.getItem("bittercare-temperament-result");
      if (savedTemperament) setTemperamentResult(savedTemperament);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const state = window.history.state ?? {};
    window.history.replaceState({ ...state, bittercareScreen: "home" satisfies Screen }, "");
    historyReadyRef.current = true;

    const handlePopState = (event: PopStateEvent) => {
      const nextScreen = event.state?.bittercareScreen as Screen | undefined;
      if (!nextScreen) return;
      handlingPopStateRef.current = true;
      setScreen((current) => {
        if (current === nextScreen) handlingPopStateRef.current = false;
        return nextScreen;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!historyReadyRef.current) return;
    if (handlingPopStateRef.current) {
      handlingPopStateRef.current = false;
      return;
    }
    if (window.history.state?.bittercareScreen !== screen) {
      window.history.pushState({ ...(window.history.state ?? {}), bittercareScreen: screen }, "");
    }
  }, [screen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    if (screen === "chew" && previousScreen !== "chew") {
      setAge(1);
      setTarget(0);
      setWhen(1);
      setChewAnswers(Array(chewQuestions.length).fill(null));
    }
    previousScreenRef.current = screen;
  }, [screen]);

  function changeLanguage(value: Lang) { setLang(value); window.localStorage.setItem("bittercare-language", value); }
  function changeBreed(value: Breed) { setBreed(value); window.localStorage.setItem("bittercare-breed", value.key); }
  function changePetName(value: string) { setPetName(value); window.localStorage.setItem("bittercare-pet-name", value); }
  function openGuide() { trackFunnel("temperament_start", "guide"); setScreen("guide"); }
  function openChew() {
    setAge(1);
    setTarget(0);
    setWhen(1);
    setChewAnswers(Array(chewQuestions.length).fill(null));
    trackFunnel("chew_start", "chew");
    setScreen("chew");
  }
  function openChewPlan() { trackFunnel("chew_result_view", "chew_result"); setScreen("chewPlan"); }
  function openProduct(origin: Screen = "chewPlan") { setProductOrigin(origin); setScreen("product"); }
  function openProgramGate(origin: "home" | "chewPlan" = "home") { setProgramGateOrigin(origin); setScreen("programGate"); }
  function startProgram() { trackFunnel("program_start", "program_gate"); setScreen("program"); }
  function reopenBreedPicker() { setBreedPickerRequest((value) => value + 1); setScreen("home"); }
  function openQuiz() {
    setQuizIndex((current) => {
      const total = quizBank.ko.length;
      if (total < 2) return 0;
      const next = Math.floor(Math.random() * (total - 1));
      return next >= current ? next + 1 : next;
    });
    setScreen("quiz");
  }
  function nextQuiz() {
    setQuizIndex((current) => (current + 1) % quizBank.ko.length);
    window.scrollTo(0, 0);
  }
  function resetChewCheck() {
    setAge(1);
    setTarget(0);
    setWhen(1);
    setChewAnswers(Array(chewQuestions.length).fill(null));
    setScreen("chew");
    window.scrollTo(0, 0);
  }

  return <main className="app-stage"><div className="app-shell" aria-live="polite">
    {screen === "home" && <HomeScreen lang={lang} onLangChange={changeLanguage} selectedBreed={breed} petName={petName} onPetNameChange={changePetName} onSelect={changeBreed} onNext={() => breed && openGuide()} onQuiz={openQuiz} onChew={openChew} onProgram={() => openProgramGate("home")} openSetupRequest={breedPickerRequest} />}
    {screen === "quiz" && <QuizScreen lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} quizIndex={quizIndex} onNextQuiz={nextQuiz} onGuide={openGuide} onChew={openChew} onProduct={() => openProduct("chewPlan")} onProgram={() => openProgramGate("home")} onHome={() => setScreen("home")} />}
    {screen === "guide" && <GuideScreen lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} caseId={caseId} onBack={() => setScreen("home")} onHome={() => setScreen("home")} onReselectBreed={reopenBreedPicker} onQuiz={openQuiz} onChew={openChew} onProduct={() => openProduct("chewPlan")} onProgram={() => openProgramGate("home")} onTemperamentResult={setTemperamentResult} onTrack={trackFunnel} />}
    {screen === "chew" && <ChewScreen lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} caseId={caseId} age={age} target={target} when={when} answers={chewAnswers} onAgeChange={setAge} onTargetChange={setTarget} onWhenChange={setWhen} onAnswerChange={(index, value) => setChewAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer))} onBack={openGuide} onHome={() => setScreen("home")} onGuide={openGuide} onQuiz={openQuiz} onProduct={() => openProduct("chewPlan")} onProgram={() => openProgramGate("home")} onPlan={openChewPlan} onTrack={trackFunnel} />}
    {screen === "chewPlan" && <ChewPlanScreen lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} age={age} target={target} when={when} answers={chewAnswers.map((answer) => answer ?? 0)} onBack={() => setScreen("chew")} onHome={() => setScreen("home")} onGuide={openGuide} onQuiz={openQuiz} onChew={openChew} onRetry={resetChewCheck} onProduct={() => openProduct("chewPlan")} onProgramGate={() => openProgramGate("chewPlan")} onTrack={trackFunnel} />}
    {screen === "product" && <ProductGuideScreen lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} onBack={() => setScreen(productOrigin)} onHome={() => setScreen("home")} onGuide={openGuide} onQuiz={openQuiz} onChew={openChew} onProgram={() => openProgramGate("home")} onTrack={trackFunnel} />}
    {screen === "programGate" && <ProgramGateScreen lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} onBack={() => setScreen(programGateOrigin === "chewPlan" ? "chewPlan" : "home")} onHome={() => setScreen("home")} onGuide={openGuide} onQuiz={openQuiz} onChew={openChew} onProduct={() => openProduct("programGate")} onProgram={startProgram} />}
    {screen === "program" && <ProgramScreenV58 lang={lang} onLangChange={changeLanguage} breed={guideBreed} petName={petName} caseId={caseId} dogAge={copy[lang].ages[age]} targetLabel={copy[lang].targets[target]} targetOptions={copy[lang].targets} temperamentResult={temperamentResult} onHome={() => setScreen("home")} onGuide={openGuide} onQuiz={openQuiz} onChew={openChew} onProduct={() => openProduct("program")} />}
  </div></main>;
}
