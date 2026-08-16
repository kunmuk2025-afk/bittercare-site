import type { LangKey } from "./breed-guides";

export type TemperamentAxisKey = "social" | "explorer" | "active" | "focused";
type Localized = Record<LangKey, string>;
export type TemperamentProfile = {
  coreKey: string; styleKey: "balanced"; emoji: string; name: string; hook: string; description: string;
  strength: string; watch: string; actions: [string, string][];
  axisScores: Record<TemperamentAxisKey, number>; topAxes: { key: TemperamentAxisKey; label: string; score: number }[];
  code: string; mbtiStyle: string; axisTones: Record<TemperamentAxisKey, string>;
};

export const temperamentAxisOrder: TemperamentAxisKey[] = ["social", "explorer", "active", "focused"];
export const temperamentAxisLevel = (score: number, lang: LangKey) => {
  const level = score >= 80 ? 4 : score >= 60 ? 3 : score >= 45 ? 2 : score >= 25 ? 1 : 0;
  const labels: Record<LangKey, string[]> = {
    ko: ["매우 낮음", "낮음", "보통", "높음", "매우 높음"],
    en: ["Very low", "Low", "Balanced", "High", "Very high"],
    zh: ["很低", "较低", "适中", "较高", "很高"],
    ja: ["とても低め", "低め", "バランス", "高め", "とても高め"],
  };
  return labels[lang][level];
};

export const temperamentAxisLabels: Record<TemperamentAxisKey, Localized> = {
  social: { ko: "사람 친화", en: "Social", zh: "亲人", ja: "人への親しみ" },
  explorer: { ko: "탐색", en: "Explorer", zh: "探索", ja: "探索" },
  active: { ko: "에너지", en: "Energy", zh: "能量", ja: "エネルギー" },
  focused: { ko: "집중", en: "Focus", zh: "专注", ja: "集中" },
};

const profileMeta: Record<string, { emoji: string; mbti: string; ko: [string,string,string]; en:[string,string,string]; zh:[string,string,string]; ja:[string,string,string] }> = {
  SEAF:{emoji:"🌟",mbti:"ENFJ",ko:["열정적인 교감 리더","사람과 새로운 경험을 함께 즐기는 타입","사람에게 친근하고 새로운 환경을 적극적으로 탐색하며, 높은 에너지와 집중력을 함께 보이는 편이에요."],en:["Warm Adventure Leader","Social, curious and focused","Enjoys people and novelty with energetic, sustained engagement."],zh:["热情互动领队","喜欢与人一起探索新体验","亲人、爱探索，同时有较高能量和持续专注。"],ja:["情熱的な交流リーダー","人と新しい経験を楽しむタイプ","人が好きで探索的、エネルギーと集中力も高めです。"]},
  SEAX:{emoji:"🎉",mbti:"ENFP",ko:["인싸 탐험대장","새로운 재미를 누구보다 빨리 찾는 타입","사람과 교류를 즐기고 새로운 것을 먼저 확인하며, 활동적이고 관심 전환도 빠른 편이에요."],en:["Social Adventure Spark","First to find the next fun thing","People-loving, exploratory, energetic and quick to switch interests."],zh:["社交探险队长","总能最先发现新乐趣","喜欢互动和探索，活力高，兴趣转换也快。"],ja:["社交的な探検隊長","新しい楽しさをすぐ見つけるタイプ","人との交流と探索が好きで、活動的かつ切り替えも速めです。"]},
  SELF:{emoji:"🧠",mbti:"ENTJ",ko:["차분한 전략 탐험가","새로운 것을 자기 페이스로 깊게 보는 타입","사람과 새 경험에 열려 있으면서도 에너지를 조절하고, 관심 있는 일은 오래 이어가는 편이에요."],en:["Strategic Explorer","Curious with a steady pace","Open to people and novelty, calmer in energy and persistent with interests."],zh:["沉稳策略探索家","按自己的节奏深入探索","对人与新体验开放，能量较稳，喜欢的事会持续较久。"],ja:["落ち着いた戦略探検家","自分のペースで深く見るタイプ","人や新しい経験に開かれつつ、落ち着いて集中を続けます。"]},
  SELX:{emoji:"🦋",mbti:"ENTP",ko:["유연한 아이디어 탐험가","궁금한 건 많고 방식은 자유로운 타입","사람과 새로운 경험을 좋아하지만 한 가지에 오래 머무르기보다 다양한 자극을 가볍게 즐겨요."],en:["Flexible Idea Explorer","Curious and free-form","Likes people and novelty while preferring varied, lighter experiences."],zh:["灵活创意探索家","好奇很多，方式很自由","喜欢人与新体验，更偏好多样而轻松的刺激。"],ja:["柔軟なアイデア探検家","好奇心が多く自由なタイプ","人や新しい経験を好み、多様な刺激を軽やかに楽しみます。"]},
  SCAF:{emoji:"🤝",mbti:"ESFJ",ko:["다정한 안정 리더","익숙함 속에서 사람을 잘 챙기는 타입","사람을 좋아하고 낯선 변화는 차근히 확인하며, 에너지와 집중을 안정적으로 사용하는 편이에요."],en:["Friendly Steady Leader","People-first with careful confidence","Social and energetic, but likes to assess novelty and stay engaged."],zh:["亲切稳定领队","在熟悉感中照顾大家","亲人，对变化较谨慎，同时能量与专注较稳定。"],ja:["やさしい安定リーダー","慣れた環境で人を大切にするタイプ","人が好きで新しさは慎重に確認し、安定して集中します。"]},
  SCAX:{emoji:"🎈",mbti:"ESFP",ko:["명랑한 분위기 메이커","사람과 놀이는 좋고 변화는 천천히 보는 타입","교류와 활동을 좋아하지만 새로운 환경은 먼저 살핀 뒤, 재미있는 일이 생기면 빠르게 관심을 옮겨요."],en:["Cheerful Mood Maker","Social play with a careful start","Enjoys people and activity, checks novelty first, then switches easily."],zh:["开朗气氛担当","爱社交玩耍，也会先观察变化","喜欢互动和活动，对新环境先观察，之后兴趣转换很快。"],ja:["明るいムードメーカー","人と遊ぶのが好きで変化は慎重","交流と活動が好きで、新環境は見てから柔軟に切り替えます。"]},
  SCLF:{emoji:"🏡",mbti:"ESTJ",ko:["든든한 루틴 지킴이","익숙한 흐름에서 집중력이 빛나는 타입","사람과 함께하는 것을 좋아하고 안정적인 환경에서 편안하며, 차분하지만 한 번 정한 활동은 잘 이어가요."],en:["Reliable Routine Keeper","Steady and persistent","Social, cautious with novelty, calmer in energy and strong in sustained focus."],zh:["可靠日常守护者","在熟悉节奏中最专注","亲人、面对新事物谨慎，能量平稳且持续性强。"],ja:["頼れるルーティン守り","慣れた流れで集中が光るタイプ","人が好きで新しさは慎重、落ち着いて長く取り組みます。"]},
  SCLX:{emoji:"🍀",mbti:"ESTP",ko:["편안한 사교 마이페이스","사람 곁에서 자기 속도를 지키는 타입","사람과 함께 있는 건 좋아하지만 변화에는 시간을 두고, 한 가지보다 여러 활동을 편안하게 오가는 편이에요."],en:["Easy Social Pacer","Friendly at a personal pace","Enjoys people, approaches novelty carefully and moves flexibly between activities."],zh:["自在社交慢节奏型","在人旁边也保持自己的节奏","喜欢有人陪伴，对变化谨慎，活动之间转换较灵活。"],ja:["心地よい社交マイペース","人のそばで自分のペースを守るタイプ","人は好きで変化はゆっくり、活動は柔軟に切り替えます。"]},
  REAF:{emoji:"🚀",mbti:"INFJ",ko:["몰입형 독립 탐험가","조용히 시작해도 관심이 생기면 깊게 가는 타입","처음 사람에게는 신중할 수 있지만 새로운 경험을 탐색하고, 에너지와 집중이 함께 올라오는 편이에요."],en:["Independent Deep Explorer","Quiet start, deep engagement","Reserved socially, exploratory, energetic and persistent once engaged."],zh:["沉浸型独立探索家","安静开始，一有兴趣就深入","社交较慢热，但爱探索，一投入便能量和专注都很高。"],ja:["没入型の独立探検家","静かに始め、興味が出ると深く進むタイプ","人には慎重でも探索的で、関心が高まると集中します。"]},
  REAX:{emoji:"✨",mbti:"INFP",ko:["자유로운 혼자놀기 탐험가","새로운 세상을 자기 방식으로 즐기는 타입","사람에게는 천천히 다가가지만 탐색과 활동을 좋아하고, 재미에 따라 관심을 자유롭게 바꿔요."],en:["Free Independent Explorer","Explores the world in a personal way","Reserved with people, active and exploratory, with flexible attention."],zh:["自由独立探索家","用自己的方式探索世界","对人慢热，但喜欢探索和活动，兴趣转换自由。"],ja:["自由なひとり遊び探検家","自分らしく新しい世界を楽しむタイプ","人にはゆっくり、探索と活動が好きで興味を柔軟に移します。"]},
  RELF:{emoji:"🔭",mbti:"INTJ",ko:["조용한 집중 탐험가","혼자서 깊이 알아가는 걸 좋아하는 타입","사람에게는 신중하지만 새로운 것을 알아보는 호기심이 있고, 차분한 에너지로 관심을 오래 유지해요."],en:["Quiet Focus Explorer","Likes to understand things deeply","Reserved socially, curious, calm and persistent."],zh:["安静专注探索家","喜欢自己深入了解","对人谨慎但好奇，能量平稳，兴趣持续较久。"],ja:["静かな集中探検家","ひとりで深く知るのが好きなタイプ","人には慎重でも好奇心があり、落ち着いて関心を維持します。"]},
  RELX:{emoji:"🌙",mbti:"INTP",ko:["느긋한 자유 탐색가","궁금할 때만 가볍게 확인하는 타입","사람에게는 천천히 다가가고 새로운 것에는 호기심이 있지만, 에너지와 관심을 자기 페이스로 유연하게 사용해요."],en:["Laid-back Free Explorer","Curious on their own terms","Reserved, curious, calm and flexible in attention."],zh:["悠闲自由探索家","想知道时才轻松确认","对人慢热、好奇，但会按自己的节奏使用能量和注意力。"],ja:["のんびり自由探検家","気になる時に軽やかに確かめるタイプ","人にはゆっくり、好奇心はありつつ自分のペースで切り替えます。"]},
  RCAF:{emoji:"🛡️",mbti:"ISFJ",ko:["신중한 든든 지킴이","익숙한 환경에서 힘을 내는 집중형","사람과 새로운 환경을 천천히 확인하고, 활동이 필요할 때는 에너지를 쓰며 관심을 오래 유지하는 편이에요."],en:["Careful Steady Guardian","Focused in familiar settings","Reserved and cautious, but energetic and persistent when engaged."],zh:["谨慎可靠守护者","在熟悉环境中发挥专注力","对人与新环境较谨慎，需要时活跃，并能长时间保持兴趣。"],ja:["慎重で頼れる守り手","慣れた環境で力を発揮する集中型","人と新環境はゆっくり確認し、必要な時は動き集中を保ちます。"]},
  RCAX:{emoji:"🎐",mbti:"ISFP",ko:["섬세한 놀이 발견가","안전하다고 느끼면 신나게 움직이는 타입","처음에는 신중하지만 익숙해지면 활동적으로 즐기고, 흥미로운 자극을 따라 자연스럽게 관심을 옮겨요."],en:["Sensitive Play Finder","Warms up, then comes alive","Reserved and cautious at first, active and flexible after feeling safe."],zh:["细腻玩乐发现家","安心后就会活跃起来","起初谨慎，熟悉后更活跃，注意力也会自然转向新刺激。"],ja:["繊細な遊び発見家","安心すると元気に動くタイプ","最初は慎重でも慣れると活動的で、興味を自然に切り替えます。"]},
  RCLF:{emoji:"📚",mbti:"ISTJ",ko:["차분한 루틴 전문가","익숙한 방식과 깊은 집중을 좋아하는 타입","사람과 새로운 환경에 천천히 적응하고, 낮은 에너지 리듬 속에서 한 가지를 꾸준히 이어가는 편이에요."],en:["Calm Routine Expert","Comfortable with steady structure","Reserved, cautious, calm and persistent."],zh:["沉稳日常专家","喜欢熟悉方式和深入专注","对人与新环境慢热，在平稳节奏中能持续做好一件事。"],ja:["落ち着いたルーティン専門家","慣れた方法と深い集中が好きなタイプ","人と新環境にはゆっくり、低めのエネルギーで継続します。"]},
  RCLX:{emoji:"☁️",mbti:"ISTP",ko:["조용한 마이페이스 관찰자","충분히 보고 필요할 때 움직이는 타입","사람과 새로운 상황을 신중하게 확인하고, 차분한 에너지로 여러 관심사를 부담 없이 오가는 편이에요."],en:["Quiet Pace Observer","Watches first and moves when ready","Reserved, cautious, calm and flexible."],zh:["安静慢节奏观察家","看够了再行动","对人与新情况谨慎，能量平稳，在不同兴趣间轻松转换。"],ja:["静かなマイペース観察者","よく見て必要な時に動くタイプ","人と新状況を慎重に確認し、落ち着いて関心を切り替えます。"]},
};

// Question order: E,A,S,F,E(reverse),S,A(reverse),F(reverse),E,A,S(reverse),F,A,E,S,F
const map: { axis: TemperamentAxisKey; reverse?: boolean }[] = [
  {axis:"explorer"},{axis:"active"},{axis:"social"},{axis:"focused"},
  {axis:"explorer",reverse:true},{axis:"social"},{axis:"active",reverse:true},{axis:"focused",reverse:true},
  {axis:"explorer"},{axis:"active"},{axis:"social",reverse:true},{axis:"focused"},
  {axis:"active"},{axis:"explorer"},{axis:"social"},{axis:"focused"},
];

function scoreAxes(scores:number[]):Record<TemperamentAxisKey,number>{
  const buckets:Record<TemperamentAxisKey,number[]>={social:[],explorer:[],active:[],focused:[]};
  scores.forEach((raw,index)=>{const spec=map[index]; if(!spec)return; buckets[spec.axis].push(spec.reverse?4-raw:raw);});
  return Object.fromEntries(temperamentAxisOrder.map(axis=>[axis,Math.round((buckets[axis].reduce((a,b)=>a+b,0)/16)*100)])) as Record<TemperamentAxisKey,number>;
}
function codeFor(s:Record<TemperamentAxisKey,number>){return `${s.social>=50?"S":"R"}${s.explorer>=50?"E":"C"}${s.active>=50?"A":"L"}${s.focused>=50?"F":"X"}`;}
function tone(score:number,lang:LangKey,positive:string,negative:string){
  const balance = lang==="ko"?"균형형":lang==="en"?"Balanced":lang==="zh"?"较均衡":"バランス";
  if(score>=56)return positive; if(score<=44)return negative; return balance;
}
const actionCopy:Record<LangKey,[string,string][]>={
  ko:[["강한 성향은 놀이로 써주세요","가장 높은 성향이 산책·노즈워크·교감 놀이에서 건강하게 발휘되게 해주세요."],["반대 성향도 천천히 경험해주세요","점수가 낮다고 부족한 것이 아닙니다. 선택권과 충분한 시간을 주면 적응에 도움이 됩니다."],["평소와 다른 변화만 기록해주세요","갑작스러운 행동 변화가 며칠 이어지면 환경·건강 상태를 함께 살펴보세요."]],
  en:[["Use strong traits in play","Let the strongest dimension shine through safe walks, sniffing and interaction."],["Give the opposite style time","A lower score is not a flaw. Choice and time can make new situations easier."],["Track unusual changes","If behavior changes suddenly for several days, review environment and health too."]],
  zh:[["把强项用在游戏中","让最高维度在散步、嗅闻和互动游戏中健康发挥。"],["给相反风格更多时间","低分并不是不足，给选择权和时间会更容易适应。"],["只记录异常变化","若行为突然变化并持续数天，请同时关注环境与健康。"]],
  ja:[["強い特性を遊びに生かす","最も高い軸を散歩・ノーズワーク・交流遊びで健やかに発揮させます。"],["反対のスタイルにも時間を","低い点数は欠点ではありません。選択肢と時間が適応を助けます。"],["普段と違う変化だけ記録","急な行動変化が数日続く時は環境と健康も確認します。"]],
};

export function calculateTemperamentProfile(scores:number[],lang:LangKey):TemperamentProfile{
  const axisScores=scoreAxes(scores); const code=codeFor(axisScores); const m=profileMeta[code];
  const tuple=m[lang];
  const topAxes=[...temperamentAxisOrder].sort((a,b)=>Math.abs(axisScores[b]-50)-Math.abs(axisScores[a]-50)).slice(0,3).map(key=>({key,label:temperamentAxisLabels[key][lang],score:axisScores[key]}));
  const axisTones={
    social:tone(axisScores.social,lang,lang==="ko"?"사교적":lang==="en"?"Social":lang==="zh"?"亲人":"社交的",lang==="ko"?"신중한 관계형":lang==="en"?"Reserved":lang==="zh"?"慢热":"慎重"),
    explorer:tone(axisScores.explorer,lang,lang==="ko"?"탐험형":lang==="en"?"Explorer":lang==="zh"?"探索型":"探索型",lang==="ko"?"신중형":lang==="en"?"Cautious":lang==="zh"?"谨慎型":"慎重型"),
    active:tone(axisScores.active,lang,lang==="ko"?"활동형":lang==="en"?"Active":lang==="zh"?"活跃型":"活動型",lang==="ko"?"느긋형":lang==="en"?"Laid-back":lang==="zh"?"悠闲型":"のんびり"),
    focused:tone(axisScores.focused,lang,lang==="ko"?"집중형":lang==="en"?"Focused":lang==="zh"?"专注型":"集中型",lang==="ko"?"유연형":lang==="en"?"Flexible":lang==="zh"?"灵活型":"柔軟型"),
  };
  const strengthLabel=lang==="ko"?"가장 선명한 성향":lang==="en"?"Clearest dimension":lang==="zh"?"最鲜明的维度":"最もはっきりした軸";
  const watchLabel=lang==="ko"?"기억할 점":lang==="en"?"Keep in mind":lang==="zh"?"记住这一点":"覚えておきたい点";
  const balancedCount=temperamentAxisOrder.filter(k=>axisScores[k]>=45&&axisScores[k]<=55).length;
  return {coreKey:code.toLowerCase(),styleKey:"balanced",emoji:m.emoji,name:tuple[0],hook:tuple[1],description:tuple[2],strength:`${strengthLabel}: ${topAxes[0].label} ${topAxes[0].score}`,watch:`${watchLabel}: ${balancedCount?`${balancedCount}${lang==="ko"?"개 축은 균형에 가까워요":lang==="en"?" dimension(s) are near balanced":lang==="zh"?"个维度接近均衡":"軸がバランスに近いです"}`:lang==="ko"?"한쪽 성향이 비교적 선명해요":lang==="en"?"The pattern is relatively distinct":lang==="zh"?"整体倾向较清晰":"傾向が比較的はっきりしています"}` ,actions:actionCopy[lang],axisScores,topAxes,code,mbtiStyle:m.mbti,axisTones};
}
