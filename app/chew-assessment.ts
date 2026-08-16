export type ChewLang = "ko" | "en" | "zh" | "ja";

export type ChewAxisKey =
  | "curiosity"
  | "chewing"
  | "activity"
  | "persistence"
  | "sensitivity"
  | "aloneAnxiety"
  | "attention"
  | "switching";

export type ChewScores = Record<ChewAxisKey, number>;

type LocalText = Record<ChewLang, string>;
type Question = { icon: string; text: LocalText; weights: Partial<Record<ChewAxisKey, number>> };

export const chewAxisOrder: ChewAxisKey[] = [
  "curiosity", "chewing", "activity", "persistence", "sensitivity", "aloneAnxiety", "attention", "switching",
];

export const chewAxisLabels: Record<ChewAxisKey, LocalText> = {
  curiosity: { ko: "호기심·탐색성", en: "Curiosity", zh: "好奇·探索", ja: "好奇心・探索" },
  chewing: { ko: "씹기 욕구", en: "Chewing drive", zh: "啃咬欲求", ja: "噛みたい欲求" },
  activity: { ko: "활동성", en: "Activity", zh: "活动性", ja: "活動性" },
  persistence: { ko: "집착·지속성", en: "Persistence", zh: "持续·执着", ja: "持続・集中" },
  sensitivity: { ko: "환경 민감성", en: "Sensitivity", zh: "环境敏感", ja: "環境への敏感さ" },
  aloneAnxiety: { ko: "혼자 있을 때 불안", en: "Alone-time worry", zh: "独处不安", ja: "留守番の不安" },
  attention: { ko: "사람 관심 요구", en: "Attention seeking", zh: "关注需求", ja: "注目してほしい気持ち" },
  switching: { ko: "전환 능력", en: "Ability to switch", zh: "注意转换", ja: "切り替える力" },
};

export const chewQuestions: Question[] = [
  { icon: "📦", text: { ko: "새 물건이 생기면 냄새를 맡거나 입으로 확인하나요?", en: "Does your dog sniff or mouth-check new objects?", zh: "出现新物品时，会闻一闻或用嘴确认吗？", ja: "新しい物を匂いや口で確かめますか？" }, weights: { curiosity: 2, chewing: 1 } },
  { icon: "🦷", text: { ko: "씹기 시작한 물건을 말려도 다시 찾는 편인가요?", en: "After being redirected, does your dog return to the same object?", zh: "制止后，还会再次寻找同一个物品吗？", ja: "止めても同じ物をまた探しますか？" }, weights: { chewing: 1, persistence: 2 } },
  { icon: "⚡", text: { ko: "놀이나 산책 뒤에도 에너지가 많이 남아 있나요?", en: "Is there still lots of energy after play or a walk?", zh: "玩耍或散步后，精力仍然很旺盛吗？", ja: "遊びや散歩の後も元気が余っていますか？" }, weights: { activity: 2, chewing: 1 } },
  { icon: "🏠", text: { ko: "혼자 있는 날에 물어뜯는 행동이 더 늘어나나요?", en: "Does chewing increase on days your dog is alone?", zh: "独处时，啃咬行为会增加吗？", ja: "留守番の日は噛む行動が増えますか？" }, weights: { aloneAnxiety: 2, sensitivity: 1 } },
  { icon: "🔔", text: { ko: "소리나 가구 배치가 달라지면 긴장하거나 서성이나요?", en: "Do noises or layout changes lead to tension or pacing?", zh: "声音或家具位置变化时，会紧张或来回走动吗？", ja: "音や家具の配置が変わると緊張したり歩き回ったりしますか？" }, weights: { sensitivity: 2, aloneAnxiety: 1 } },
  { icon: "👀", text: { ko: "보호자가 바쁠 때 물건을 물어 관심을 끄나요?", en: "Does chewing appear to get your attention when you are busy?", zh: "主人忙碌时，会通过咬东西来吸引关注吗？", ja: "飼い主が忙しい時、物を噛んで気を引きますか？" }, weights: { attention: 2, activity: 1 } },
  { icon: "🧸", text: { ko: "씹어도 되는 장난감을 주면 관심을 옮기기 쉬운가요?", en: "Is it easy to switch to an approved chew toy?", zh: "提供可啃咬玩具后，能轻松转移注意吗？", ja: "噛んでよいおもちゃへ簡単に切り替えられますか？" }, weights: { switching: 2, chewing: 1 } },
  { icon: "🔁", text: { ko: "마음에 든 물건은 며칠 동안 반복해서 찾나요?", en: "Does your dog seek a favorite object repeatedly for days?", zh: "喜欢的物品会连续几天反复寻找吗？", ja: "気に入った物を何日も繰り返し探しますか？" }, weights: { persistence: 2, curiosity: 1 } },
  { icon: "🌙", text: { ko: "잠들기 전이나 흥분한 뒤에 무언가를 씹으려 하나요?", en: "Does your dog seek something to chew before sleep or after excitement?", zh: "睡前或兴奋后，会想找东西啃咬吗？", ja: "寝る前や興奮した後に何かを噛みたがりますか？" }, weights: { chewing: 2, activity: 1 } },
  { icon: "🔎", text: { ko: "모서리나 틈처럼 새로운 곳을 찾아다니며 확인하나요?", en: "Does your dog seek out corners and gaps to investigate?", zh: "会寻找角落或缝隙等新地方进行探索吗？", ja: "角や隙間など新しい場所を探して確かめますか？" }, weights: { curiosity: 2, persistence: 1 } },
  { icon: "🐾", text: { ko: "보호자를 따라다니며 계속 반응을 확인하나요?", en: "Does your dog follow you and repeatedly check your response?", zh: "会跟随主人并不断确认主人的反应吗？", ja: "飼い主について回り、反応を何度も確かめますか？" }, weights: { attention: 2, aloneAnxiety: 1 } },
  { icon: "✨", text: { ko: "간식 찾기나 짧은 놀이로 기분을 바꾸기 쉬운가요?", en: "Can a treat search or short game shift your dog’s mood?", zh: "通过找零食或短暂游戏，能轻松转换情绪吗？", ja: "おやつ探しや短い遊びで気分を切り替えやすいですか？" }, weights: { switching: 2 } },
];

export const chewScale: Record<ChewLang, string[]> = {
  ko: ["전혀 아니에요", "드물어요", "가끔 그래요", "자주 그래요", "거의 매번"],
  en: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
  zh: ["完全不会", "很少", "有时", "经常", "几乎每次"],
  ja: ["まったくない", "ほとんどない", "時々", "よくある", "ほぼ毎回"],
};

type ProfileKey = "explorer" | "sensitive" | "energizer" | "focused" | "attention" | "alert" | "discoverer" | "shadow" | "absorbed" | "flexible" | "playmate" | "careful" | "repeater" | "sensory" | "mover" | "observer" | "connector" | "balanced";

export type ChewResult = {
  profile: ProfileKey;
  title: string;
  summary: string;
  cause: string;
  caution: string;
  watchTitle: string;
  watch: string[];
  steps: string[];
  productTitle: string;
  productBody: string;
  scores: ChewScores;
  topAxes: { key: ChewAxisKey; label: string; score: number }[];
};

const profileTitles: Record<ProfileKey, LocalText> = {
  explorer: { ko: "궁금하면 입으로 확인하는 탐험가", en: "The mouth-first explorer", zh: "好奇就用嘴确认的探险家", ja: "気になると口で確かめる探検家" },
  sensitive: { ko: "혼자 있으면 마음이 복잡해지는 예민형", en: "The sensitive solo worrier", zh: "独处时容易不安的敏感型", ja: "ひとり時間に心が揺れる繊細タイプ" },
  energizer: { ko: "씹고 놀면 금방 잊는 에너자이저", en: "The chew-and-move energizer", zh: "咬一咬玩一玩就能转换的活力派", ja: "噛んで遊ぶと切り替えやすい元気タイプ" },
  focused: { ko: "한번 시작하면 끝을 보는 집중형", en: "The determined chewer", zh: "一旦开始就会坚持的专注型", ja: "始めたら続ける集中タイプ" },
  attention: { ko: "나 좀 봐주세요, 관심 요청형", en: "The look-at-me signaler", zh: "请看看我的关注请求型", ja: "こっちを見て、の注目タイプ" },
  alert: { ko: "변화를 입으로 풀어보는 긴장형", en: "The change-sensitive chewer", zh: "用啃咬缓解变化的紧张型", ja: "変化を噛むことで整える緊張タイプ" },
  discoverer: { ko: "새것만 보면 달려가는 발견형", en: "The eager discoverer", zh: "看到新鲜事物就出发的发现型", ja: "新しい物へ一直線の発見タイプ" },
  shadow: { ko: "보호자 곁이 가장 편한 그림자형", en: "The guardian-shadow type", zh: "待在主人身边最安心的影子型", ja: "飼い主のそばが安心な影タイプ" },
  absorbed: { ko: "한번 꽂히면 오래가는 몰입형", en: "The deep-focus type", zh: "一旦着迷就持续很久的沉浸型", ja: "気に入ると長く続く没頭タイプ" },
  flexible: { ko: "좋은 대안이면 바꿀 수 있는 유연형", en: "The flexible switcher", zh: "有好选择就能转换的灵活型", ja: "良い代わりがあれば切り替えられる柔軟タイプ" },
  playmate: { ko: "함께 놀고 싶은 놀이 초대형", en: "The play-invitation type", zh: "想一起玩的邀请型", ja: "一緒に遊びたい遊びのお誘いタイプ" },
  careful: { ko: "조심스럽게 입으로 확인하는 관찰형", en: "The careful investigator", zh: "谨慎地用嘴确认的观察型", ja: "慎重に口で確かめる観察タイプ" },
  repeater: { ko: "긴장을 반복 행동으로 푸는 반복형", en: "The repeating stress reliever", zh: "用重复行为缓解紧张的反复型", ja: "緊張を繰り返し行動で整える反復タイプ" },
  sensory: { ko: "씹는 감각이 중요한 촉감형", en: "The texture-seeking chewer", zh: "重视啃咬触感的感官型", ja: "噛む感触が大切な触感タイプ" },
  mover: { ko: "몸이 먼저 움직이는 활력형", en: "The always-moving type", zh: "身体先行动的活力型", ja: "体が先に動く活動タイプ" },
  observer: { ko: "작은 변화도 빠르게 알아채는 감각형", en: "The quick-notice observer", zh: "细小变化也能快速察觉的感知型", ja: "小さな変化にすぐ気づく感覚タイプ" },
  connector: { ko: "반응을 주고받고 싶은 교감형", en: "The connection seeker", zh: "希望互动回应的交流型", ja: "反応を交わしたい交流タイプ" },
  balanced: { ko: "상황에 따라 이유가 달라지는 균형형", en: "The situational all-rounder", zh: "原因会随情境变化的均衡型", ja: "状況で理由が変わるバランスタイプ" },
};

const ui = {
  ko: {
    summary: (top: string, second: string, third: string) => `대표 성향은 ${top}, ${second}, ${third}입니다. 세 가지 신호를 함께 보면 물어뜯기의 시작점이 더 선명해져요.`,
    cause: { curiosity: "불안해서라기보다 궁금하고 재미있어서 입으로 탐색하는 편에 가깝습니다.", anxiety: "물건 자체보다 혼자 있는 시간이나 환경 변화에서 생긴 긴장을 물어뜯기로 풀 가능성이 있습니다.", energy: "남은 에너지와 씹기 욕구가 물어뜯기로 이어지는 편입니다. 충분히 움직인 뒤에는 전환이 쉬워질 수 있어요.", persistence: "씹는 경험이 재미있으면 같은 장소를 반복해서 찾는 경향이 있습니다.", attention: "보호자의 반응을 기대하며 물건을 무는 행동이 시작될 수 있습니다.", balanced: "한 가지 이유보다 상황에 따라 호기심·에너지·감정 신호가 함께 작용하는 편입니다." },
    caution: ["낮음", "보통", "상황에 따라 높음", "높음"], watchTitle: "특히 살펴볼 곳과 순간", 
    watches: { curiosity: ["가구 모서리", "벽지 끝부분", "전선", "새로 놓은 물건"], anxiety: ["외출 직후", "혼자 있는 시간", "가구 배치 변화", "보호자가 바쁠 때"], energy: ["산책 전후", "잠들기 전", "흥분한 뒤", "손이 닿기 쉬운 생활용품"], persistence: ["이미 씹었던 자리", "들뜬 모서리", "반복해서 찾는 물건", "보호자가 보지 않는 순간"], attention: ["통화·업무 중", "놀이가 끝난 직후", "보호자가 다른 일에 집중할 때", "반응이 컸던 물건"], balanced: ["자주 반복되는 장소", "특정 시간대", "새 물건 주변", "혼자 있는 순간"] },
    steps: { curiosity: ["탐색 전에 접근을 줄여주세요", "씹어도 되는 물건을 가까이 두세요", "좋은 선택으로 옮기면 바로 칭찬하세요"], anxiety: ["예측 가능한 환경을 먼저 만들어주세요", "혼자 있는 시간을 짧게 연습하세요", "씹기 대신 쉴 수 있는 행동을 연결하세요"], energy: ["짧은 냄새놀이로 에너지를 먼저 써주세요", "안전한 대체 장난감을 충분히 주세요", "보호할 표면은 미리 차단하세요"], persistence: ["반복 장소의 접근을 먼저 막아주세요", "같은 촉감의 안전한 대안을 주세요", "짧게 성공하고 자리를 바꾸어주세요"], attention: ["물어뜯을 때 큰 반응은 줄여주세요", "차분할 때 먼저 관심을 주세요", "장난감 선택을 교감 신호로 만들어주세요"], balanced: ["장소와 시간을 먼저 기록하세요", "씹어도 되는 선택지를 준비하세요", "잘한 순간을 짧고 자주 칭찬하세요"] },
    product: { curiosity: ["탐색하기 전에 보호해주세요", "새로운 곳을 입으로 확인하는 아이는 접근 초기부터 물어뜯기 어렵게 보호하는 것이 중요해요."], anxiety: ["불안 관리와 표면 보호를 함께 시작하세요", "불안이 높은 아이는 환경 안정과 혼자 있는 시간 연습을 먼저 하고, 비터케어는 표면 보호용 보조 도구로 함께 사용해주세요."], energy: ["막는 것과 씹을 곳을 함께 만들어주세요", "보호할 곳에는 비터케어를 사용하고, 대신 씹어도 되는 장난감을 충분히 제공해주세요."], persistence: ["반복해서 찾는 곳에 경계를 만들어주세요", "자주 되찾는 표면은 넓고 밀착되게 보호하고, 바로 옆에 안전한 대체물을 연결해주세요."], attention: ["반응 대신 좋은 선택을 알려주세요", "비터케어로 금지 표면을 보호하되, 장난감을 선택했을 때 보호자의 관심이 돌아오도록 알려주세요."], balanced: ["보호와 대체 행동을 함께 시작하세요", "자주 물어뜯는 표면을 보호하면서 씹어도 되는 선택을 가까이 준비해주세요."] },
  },
  en: { summary: (a: string,b: string,c: string)=>`The leading traits are ${a}, ${b}, and ${c}. Together they show where chewing is most likely to begin.`, cause: { curiosity:"Chewing is more likely driven by curiosity and fun than anxiety.", anxiety:"Chewing may rise when alone or when the environment changes.", energy:"Unused energy and a strong chewing drive are likely to combine.", persistence:"Once chewing feels rewarding, the same spot may be revisited.", attention:"Chewing may be used to invite your response.", balanced:"Curiosity, energy and emotion may each matter depending on the situation." }, caution:["Low","Moderate","Situationally high","High"], watchTitle:"Watch these places and moments", watches:{curiosity:["Furniture corners","Wallpaper edges","Cables","New objects"],anxiety:["After you leave","Alone time","Layout changes","When you are busy"],energy:["Before/after walks","Before sleep","After excitement","Easy-to-reach items"],persistence:["Previously chewed spots","Loose edges","Favorite targets","Unsupervised moments"],attention:["Calls or work time","After play ends","When you focus elsewhere","Objects that got a big reaction"],balanced:["Repeated locations","Specific times","Near new objects","Alone moments"]}, steps:{curiosity:["Limit access before exploration","Place an approved chew nearby","Praise the switch immediately"],anxiety:["Create a predictable environment","Practice short alone times","Build a calm alternative behavior"],energy:["Use short scent games first","Offer enough safe chew options","Protect target surfaces early"],persistence:["Block repeated locations first","Offer a similar safe texture","End on a short success"],attention:["Keep reactions small during chewing","Offer attention during calm moments","Make toy choice the connection signal"],balanced:["Track place and time","Prepare approved chew choices","Praise small successes often"]}, product:{curiosity:["Protect before exploration","For mouth-first explorers, protect new surfaces before the habit starts."],anxiety:["Do not rely on bitter taste alone","Start with environmental stability and alone-time practice; use BitterCare only as surface support."],energy:["Block it and create a place to chew","Use BitterCare on protected surfaces and provide plenty of approved chew toys."],persistence:["Create a boundary at repeat spots","Protect repeated targets widely and pair them with a safe alternative."],attention:["Teach the better way to get a response","Protect forbidden surfaces, then return attention when your dog chooses the toy."],balanced:["Combine protection and alternatives","Protect frequent targets and keep an approved chew close by."]} },
  zh: { summary:(a:string,b:string,c:string)=>`主要特征是${a}、${b}和${c}。结合三种信号，更容易看清啃咬行为的起点。`, cause:{curiosity:"与其说是不安，更接近因为好奇和有趣而用嘴探索。",anxiety:"独处或环境变化带来的紧张可能增加啃咬。",energy:"剩余精力与啃咬欲求可能共同引发行为。",persistence:"一旦啃咬变得有趣，可能反复寻找同一位置。",attention:"可能通过啃咬来期待主人的回应。",balanced:"好奇、精力与情绪会随情境共同作用。"},caution:["低","中等","视情况较高","高"],watchTitle:"特别留意这些地方和时刻",watches:{curiosity:["家具边角","墙纸边缘","电线","新物品"],anxiety:["外出后","独处时","家具位置变化","主人忙碌时"],energy:["散步前后","睡前","兴奋后","容易接触的物品"],persistence:["曾啃咬的位置","翘起边缘","反复寻找的物品","无人看护时"],attention:["通话或工作时","游戏结束后","主人专注其他事情时","曾引起强烈反应的物品"],balanced:["反复出现的地点","特定时间","新物品附近","独处时"]},steps:{curiosity:["探索前减少接触","附近放置可啃咬物","转换成功后立即表扬"],anxiety:["先营造可预期的环境","短时间练习独处","建立可放松的替代行为"],energy:["先进行短暂嗅闻游戏","提供足够安全啃咬物","提前保护目标表面"],persistence:["先阻止进入反复位置","提供触感相似的安全替代物","短暂成功后转换地点"],attention:["啃咬时减少强烈反应","平静时主动给予关注","让选择玩具成为互动信号"],balanced:["先记录地点和时间","准备可啃咬的选择","经常表扬小小的成功"]},product:{curiosity:["探索前先保护","喜欢用嘴确认新物品时，应在习惯形成前保护表面。"],anxiety:["不要只依赖苦味","先稳定环境并练习独处，BitterCare仅作为表面保护辅助。"],energy:["阻挡与可啃咬空间同时准备","在需要保护处使用BitterCare，同时提供足够的安全玩具。"],persistence:["在反复寻找处建立边界","大面积保护常去的表面，并在旁边连接安全替代物。"],attention:["用好选择获得回应","保护禁咬表面，并在选择玩具时给予关注。"],balanced:["同时开始保护与替代","保护常啃咬表面，并在附近准备可啃咬物。"]}},
  ja: { summary:(a:string,b:string,c:string)=>`主な特徴は${a}、${b}、${c}です。3つのサインを合わせると、噛む行動のきっかけが見えやすくなります。`,cause:{curiosity:"不安よりも、気になって楽しいため口で探索する傾向です。",anxiety:"留守番や環境の変化による緊張が噛む行動につながることがあります。",energy:"余ったエネルギーと噛みたい欲求が重なりやすいタイプです。",persistence:"噛む経験が楽しいと、同じ場所を繰り返し探す傾向があります。",attention:"飼い主の反応を求めて物を噛むことがあります。",balanced:"好奇心・元気・感情のサインが状況ごとに関係します。"},caution:["低め","ふつう","状況により高め","高め"],watchTitle:"特に見ておきたい場所と瞬間",watches:{curiosity:["家具の角","壁紙の端","コード","新しく置いた物"],anxiety:["外出直後","留守番中","家具配置の変化","飼い主が忙しい時"],energy:["散歩の前後","寝る前","興奮した後","手の届く生活用品"],persistence:["以前噛んだ場所","浮いた端","繰り返し探す物","見ていない瞬間"],attention:["通話・仕事中","遊びの直後","別のことに集中している時","大きく反応した物"],balanced:["繰り返す場所","特定の時間","新しい物の周辺","留守番中"]},steps:{curiosity:["探索前に近づきにくくする","噛んでよい物を近くに置く","切り替えたらすぐ褒める"],anxiety:["予測できる環境を作る","短い留守番から練習する","落ち着ける代替行動をつなぐ"],energy:["短いノーズワークを先に行う","安全な噛む物を十分用意する","守る表面は早めに保護する"],persistence:["繰り返す場所を先に遮る","似た感触の安全な代替物を出す","短い成功で場所を変える"],attention:["噛んだ時の大反応を減らす","落ち着いた時に先に注目する","おもちゃ選びを交流の合図にする"],balanced:["場所と時間を記録する","噛んでよい選択肢を用意する","小さな成功をこまめに褒める"]},product:{curiosity:["探索する前に保護しましょう","新しい場所を口で確かめる子は、習慣になる前の表面保護が大切です。"],anxiety:["苦味だけで解決しようとしないでください","環境の安定と留守番練習を先に行い、BitterCareは表面保護の補助として使いましょう。"],energy:["防ぐことと噛む場所を一緒に作りましょう","守る場所にはBitterCareを使い、安全に噛めるおもちゃを十分用意しましょう。"],persistence:["繰り返す場所に境界を作りましょう","よく戻る表面を広く保護し、すぐそばに安全な代替物を置きましょう。"],attention:["反応より良い選択を伝えましょう","禁止面を保護し、おもちゃを選んだ時に注目が戻るよう教えましょう。"],balanced:["保護と代替行動を一緒に始めましょう","よく噛む表面を守り、噛んでよい物を近くに用意しましょう。"]}},
} as const;

type CauseKey = "curiosity" | "anxiety" | "energy" | "persistence" | "attention" | "balanced";

function selectProfile(s: ChewScores): { profile: ProfileKey; cause: CauseKey } {
  if (s.curiosity >= 67 && s.chewing >= 62) return { profile: "explorer", cause: "curiosity" };
  if (s.aloneAnxiety >= 67 && s.sensitivity >= 62) return { profile: "sensitive", cause: "anxiety" };
  if (s.activity >= 70 && s.chewing >= 62 && s.switching >= 55) return { profile: "energizer", cause: "energy" };
  if (s.persistence >= 70 && s.chewing >= 58) return { profile: "focused", cause: "persistence" };
  if (s.attention >= 68 && s.chewing >= 45) return { profile: "attention", cause: "attention" };
  if (s.sensitivity >= 68 && s.chewing >= 45) return { profile: "alert", cause: "anxiety" };
  if (s.curiosity >= 65 && s.activity >= 60) return { profile: "discoverer", cause: "curiosity" };
  if (s.aloneAnxiety >= 62 && s.attention >= 62) return { profile: "shadow", cause: "anxiety" };
  if (s.persistence >= 68 && s.switching < 52) return { profile: "absorbed", cause: "persistence" };
  if (s.switching >= 70 && s.chewing >= 48) return { profile: "flexible", cause: "energy" };
  if (s.activity >= 64 && s.attention >= 58) return { profile: "playmate", cause: "attention" };
  if (s.curiosity >= 58 && s.sensitivity >= 58) return { profile: "careful", cause: "curiosity" };
  if (s.persistence >= 62 && s.aloneAnxiety >= 58) return { profile: "repeater", cause: "anxiety" };
  const top = [...chewAxisOrder].sort((a, b) => s[b] - s[a])[0];
  if (top === "chewing") return { profile: "sensory", cause: "energy" };
  if (top === "activity") return { profile: "mover", cause: "energy" };
  if (top === "sensitivity") return { profile: "observer", cause: "anxiety" };
  if (top === "attention") return { profile: "connector", cause: "attention" };
  return { profile: "balanced", cause: "balanced" };
}

export function calculateChewResult(answers: number[], lang: ChewLang, age: number, when: number): ChewResult {
  const totals = Object.fromEntries(chewAxisOrder.map((key) => [key, 0])) as ChewScores;
  const maximums = Object.fromEntries(chewAxisOrder.map((key) => [key, 0])) as ChewScores;
  chewQuestions.forEach((question, index) => {
    const answer = Math.max(0, Math.min(4, answers[index] ?? 0));
    Object.entries(question.weights).forEach(([axis, weight]) => {
      totals[axis as ChewAxisKey] += answer * (weight ?? 0);
      maximums[axis as ChewAxisKey] += 4 * (weight ?? 0);
    });
  });
  const scores = Object.fromEntries(chewAxisOrder.map((key) => [key, maximums[key] ? Math.round((totals[key] / maximums[key]) * 100) : 0])) as ChewScores;
  if (age <= 1) { scores.curiosity = Math.min(100, scores.curiosity + 5); scores.chewing = Math.min(100, scores.chewing + 7); }
  if (when === 0) { scores.aloneAnxiety = Math.min(100, scores.aloneAnxiety + 8); }
  if (when === 1) { scores.activity = Math.min(100, scores.activity + 6); scores.attention = Math.min(100, scores.attention + 5); }
  if (when === 2) scores.sensitivity = Math.min(100, scores.sensitivity + 4);
  if (when === 3) scores.persistence = Math.min(100, scores.persistence + 7);
  const topAxes = [...chewAxisOrder].sort((a, b) => scores[b] - scores[a]).slice(0, 3).map((key) => ({ key, label: chewAxisLabels[key][lang], score: scores[key] }));
  const selected = selectProfile(scores);
  const text = ui[lang];
  const cautionIndex = scores.chewing >= 75 || (scores.persistence >= 72 && scores.switching < 50) ? 3 : scores.aloneAnxiety >= 70 || scores.sensitivity >= 72 ? 2 : scores.chewing >= 45 ? 1 : 0;
  return {
    profile: selected.profile,
    title: profileTitles[selected.profile][lang],
    summary: text.summary(...topAxes.map((axis) => `${axis.label} ${axis.score}`) as [string, string, string]),
    cause: text.cause[selected.cause],
    caution: text.caution[cautionIndex],
    watchTitle: text.watchTitle,
    watch: [...text.watches[selected.cause]],
    steps: [...text.steps[selected.cause]],
    productTitle: text.product[selected.cause][0],
    productBody: text.product[selected.cause][1],
    scores,
    topAxes,
  };
}
