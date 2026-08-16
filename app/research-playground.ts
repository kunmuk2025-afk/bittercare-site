import type { LangKey } from "./breed-guides";

type ResearchStory = {
  flag: string;
  region: string;
  badge: string;
  stat: string;
  title: string;
  body: string;
  takeaway: string;
  href: string;
  source: string;
};

export const researchPlaygroundText: Record<LangKey, {
  eyebrow: string;
  title: string;
  lead: string;
  passportTitle: string;
  passportLead: string;
  lenses: [string, string, string];
  lensNotes: [string, string, string];
  quizEyebrow: string;
  quizQuestion: string;
  yes: string;
  no: string;
  quizCorrect: string;
  quizWrong: string;
  quizExplain: string;
  exploreTitle: string;
  exploreLead: string;
  takeaway: string;
  openSource: string;
  cautionTitle: string;
  cautionBody: string;
  stories: ResearchStory[];
}> = {
  ko: {
    eyebrow: "WORLD DOG RESEARCH",
    title: "세계 연구를\n우리 아이에게 쓰는 법",
    lead: "숫자를 외우기보다 견종·생활·개체를 세 겹으로 살펴보세요.",
    passportTitle: "우리 아이 행동 여권",
    passportLead: "연구는 정답지가 아니라 관찰을 시작하는 지도예요.",
    lenses: ["견종 힌트", "생활 맥락", "개체 신호"],
    lensNotes: ["원래 하던 일과 평균 경향", "나이·건강·환경·경험", "오늘 실제로 보인 선택과 회복"],
    quizEyebrow: "10-SECOND QUIZ",
    quizQuestion: "같은 견종이면 성격도 거의 같을까요?",
    yes: "네, 거의 같아요", no: "아니요, 개체차가 커요",
    quizCorrect: "정답이에요!", quizWrong: "견종만으로는 부족해요",
    quizExplain: "18,000마리 이상이 참여한 2022년 연구에서 견종은 개별 행동 차이의 약 9%만 설명했습니다. 견종은 힌트로 쓰고, 실제 반응을 함께 기록하는 것이 더 정확해요.",
    exploreTitle: "세계 연구 카드",
    exploreLead: "옆으로 넘기며 핵심만 확인해보세요.",
    takeaway: "보호자에게 필요한 한 줄", openSource: "원문 보기",
    cautionTitle: "통계 숫자보다 출처의 성격을 먼저 봅니다",
    cautionBody: "논문·표준화 설문·현장 테스트·사고 신고는 서로 다른 질문에 답합니다. 합격률이나 사고 건수를 물림 확률로 바꾸지 않았습니다.",
    stories: [
      { flag: "🇺🇸", region: "미국 · 유전체/설문", badge: "동료평가 연구", stat: "약 9%", title: "견종이 설명한 개별 행동 차이", body: "Darwin’s Ark의 18,000마리 이상 설문과 2,000마리 이상 유전체를 함께 분석했습니다.", takeaway: "견종은 성격의 운명이 아니라 약한 힌트입니다.", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9675396/", source: "Morrill et al., Science 2022" },
      { flag: "🇺🇸", region: "미국 · 생애 데이터", badge: "대규모 관찰", stat: "47,444", title: "행동 기준선을 만든 반려견 수", body: "공포·주의/흥분·공격성·훈련 가능성은 견종뿐 아니라 생애단계, 성별, 중성화 상태, 크기와 생활환경에도 연관됐습니다.", takeaway: "평소 기준선을 알아야 변화를 빨리 발견할 수 있어요.", href: "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0330257", source: "Li et al., PLOS ONE 2025" },
      { flag: "🇫🇮", region: "핀란드 · 불안 행동", badge: "동료평가 연구", stat: "32%", title: "소음 민감성이 보고된 비율", body: "13,700마리 표본에서 소음 민감성은 가장 흔한 불안 관련 특성이었고, 불안 특성은 견종 사이에도 차이가 있었습니다.", takeaway: "짖음만 보지 말고 소리 뒤의 두려움과 회복시간을 보세요.", href: "https://helda.helsinki.fi/items/f36b8096-2d2e-42bd-a8fc-a40eb12b1858", source: "Salonen et al., Scientific Reports 2020" },
      { flag: "🇸🇪", region: "스웨덴 · 현장 관찰", badge: "표준화 기술", stat: "2012–", title: "BPH 행동·성격 기술 운영", body: "스웨덴켄넬클럽은 정해진 상황에서 개의 반응을 기술해 보호자·견종클럽·브리더가 이해하도록 돕습니다.", takeaway: "한 번의 합격·불합격보다 어떤 상황에서 어떻게 회복하는지가 중요해요.", href: "https://www.skk.se/en/about-us3/var-organisation/kommitteer--arbetsgrupper/kommitten-for-hundars-mentalitet/", source: "Swedish Kennel Club" },
      { flag: "🇺🇸", region: "미국 · 기질 테스트", badge: "해석 주의", stat: "RAW", title: "ATTS 합격률은 공격성 순위가 아닙니다", body: "ATTS 자체도 공개 통계가 과학 연구가 아니며, 참여견의 대표성과 전체 견종 개체수 분모가 없다고 밝힙니다.", takeaway: "치와와와 핏불의 합격률을 물림 위험 비교로 쓰면 안 됩니다.", href: "https://atts.org/breed-statistics/", source: "American Temperament Test Society" },
    ],
  },
  en: {
    eyebrow: "WORLD DOG RESEARCH", title: "Turn global research\ninto daily care", lead: "Use three lenses—breed, life and individual—instead of memorizing numbers.",
    passportTitle: "Your dog’s behavior passport", passportLead: "Research is a map for observation, not an answer key.",
    lenses: ["Breed clue", "Life context", "Individual signal"], lensNotes: ["Historic work and averages", "Age, health, environment, experience", "Today’s choices and recovery"],
    quizEyebrow: "10-SECOND QUIZ", quizQuestion: "Do dogs of the same breed have nearly the same personality?", yes: "Yes, mostly", no: "No, individuals differ", quizCorrect: "Correct!", quizWrong: "Breed alone is not enough", quizExplain: "A 2022 study with more than 18,000 dogs found breed explained about 9% of individual behavioral variation. Use breed as a clue and record the dog in front of you.",
    exploreTitle: "Global research cards", exploreLead: "Swipe for the useful takeaway.", takeaway: "One useful takeaway", openSource: "Open source", cautionTitle: "Check what a statistic measures first", cautionBody: "Papers, standardized surveys, field tests and incident reports answer different questions. We do not turn pass rates or incident counts into bite probabilities.",
    stories: [
      { flag: "🇺🇸", region: "US · Genomics/survey", badge: "Peer reviewed", stat: "≈9%", title: "Individual behavior variation explained by breed", body: "Darwin’s Ark combined surveys from 18,000+ dogs with genomes from 2,000+ dogs.", takeaway: "Breed is a modest clue, not personality destiny.", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9675396/", source: "Morrill et al., Science 2022" },
      { flag: "🇺🇸", region: "US · Life-course data", badge: "Large observation", stat: "47,444", title: "Dogs used to establish behavior baselines", body: "Fear, attention/arousal, aggression and trainability were associated with life stage, sex, reproductive status, size and living context as well as breed.", takeaway: "A personal baseline helps you spot meaningful change.", href: "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0330257", source: "Li et al., PLOS ONE 2025" },
      { flag: "🇫🇮", region: "Finland · Anxiety", badge: "Peer reviewed", stat: "32%", title: "Dogs reported with noise sensitivity", body: "In 13,700 dogs, noise sensitivity was the most common anxiety-related trait and anxiety traits differed among breeds.", takeaway: "Look beyond barking to fear and recovery after sound.", href: "https://helda.helsinki.fi/items/f36b8096-2d2e-42bd-a8fc-a40eb12b1858", source: "Salonen et al., Scientific Reports 2020" },
      { flag: "🇸🇪", region: "Sweden · Field description", badge: "Standardized", stat: "2012–", title: "BPH behavior and personality description", body: "The Swedish Kennel Club describes responses in set situations to support owners, breed clubs and breeders.", takeaway: "How a dog responds and recovers matters more than a single pass/fail label.", href: "https://www.skk.se/en/about-us3/var-organisation/kommitteer--arbetsgrupper/kommitten-for-hundars-mentalitet/", source: "Swedish Kennel Club" },
      { flag: "🇺🇸", region: "US · Temperament test", badge: "Use with caution", stat: "RAW", title: "ATTS pass rates are not aggression rankings", body: "ATTS states its public statistics are not a scientific study and lack representative participation and breed-population denominators.", takeaway: "Do not compare Chihuahua and pit bull pass rates as bite risk.", href: "https://atts.org/breed-statistics/", source: "American Temperament Test Society" },
    ],
  },
  zh: {
    eyebrow: "全球犬类研究", title: "把全球研究\n用在爱犬身上", lead: "不要背数字，用犬种、生活与个体三层视角观察。",
    passportTitle: "爱犬行为护照", passportLead: "研究是开始观察的地图，而不是标准答案。",
    lenses: ["犬种线索", "生活背景", "个体信号"], lensNotes: ["原始工作与平均倾向", "年龄、健康、环境与经历", "今天真实的选择与恢复"],
    quizEyebrow: "10秒问答", quizQuestion: "同一犬种的性格几乎相同吗？", yes: "是的，大致相同", no: "不是，个体差异很大", quizCorrect: "答对了！", quizWrong: "只看犬种还不够", quizExplain: "2022年超过18,000只犬的研究发现，犬种仅能解释约9%的个体行为差异。犬种只能作为线索，还要记录眼前这只狗的反应。",
    exploreTitle: "全球研究卡", exploreLead: "横向滑动查看实用重点。", takeaway: "给主人最有用的一句话", openSource: "查看原文", cautionTitle: "先确认统计数字测量的是什么", cautionBody: "论文、标准化问卷、现场测试与事故举报回答的问题不同。本应用不会把通过率或事故数换算成咬人概率。",
    stories: [
      { flag: "🇺🇸", region: "美国 · 基因/问卷", badge: "同行评议", stat: "约9%", title: "犬种解释的个体行为差异", body: "Darwin’s Ark结合了18,000多只犬的问卷与2,000多只犬的基因组。", takeaway: "犬种是有限线索，不是性格命运。", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9675396/", source: "Morrill等，Science 2022" },
      { flag: "🇺🇸", region: "美国 · 生命历程", badge: "大规模观察", stat: "47,444", title: "建立行为基线的犬只数量", body: "恐惧、注意/兴奋、攻击性和可训练性除犬种外，也与生命阶段、性别、绝育、体型与居住环境相关。", takeaway: "了解平时的基线，才能更快发现变化。", href: "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0330257", source: "Li等，PLOS ONE 2025" },
      { flag: "🇫🇮", region: "芬兰 · 焦虑行为", badge: "同行评议", stat: "32%", title: "报告有噪音敏感的比例", body: "13,700只犬中，噪音敏感是最常见的焦虑相关特征，不同犬种间也存在差异。", takeaway: "不要只看吠叫，也要看声音后的恐惧与恢复时间。", href: "https://helda.helsinki.fi/items/f36b8096-2d2e-42bd-a8fc-a40eb12b1858", source: "Salonen等，Scientific Reports 2020" },
      { flag: "🇸🇪", region: "瑞典 · 现场描述", badge: "标准化描述", stat: "2012–", title: "BPH行为与性格描述", body: "瑞典养犬俱乐部在设定情境中描述犬只反应，帮助主人、犬种俱乐部与繁育者理解。", takeaway: "如何反应和恢复，比一次通过或失败更重要。", href: "https://www.skk.se/en/about-us3/var-organisation/kommitteer--arbetsgrupper/kommitten-for-hundars-mentalitet/", source: "瑞典养犬俱乐部" },
      { flag: "🇺🇸", region: "美国 · 气质测试", badge: "谨慎解读", stat: "原始", title: "ATTS通过率不是攻击性排名", body: "ATTS明确表示公开数据不是科学研究，参与不具代表性，也没有犬种总体数量分母。", takeaway: "不能把吉娃娃与比特犬通过率当作咬人风险比较。", href: "https://atts.org/breed-statistics/", source: "American Temperament Test Society" },
    ],
  },
  ja: {
    eyebrow: "世界の犬研究", title: "世界の研究を\n愛犬の暮らしへ", lead: "数字を暗記せず、犬種・生活・個体の3つの視点で見ます。",
    passportTitle: "愛犬の行動パスポート", passportLead: "研究は答えではなく、観察を始める地図です。",
    lenses: ["犬種のヒント", "生活の背景", "個体のサイン"], lensNotes: ["元の仕事と平均傾向", "年齢・健康・環境・経験", "今日の選択と回復"],
    quizEyebrow: "10秒クイズ", quizQuestion: "同じ犬種なら性格もほぼ同じ？", yes: "はい、ほぼ同じ", no: "いいえ、個体差が大きい", quizCorrect: "正解です！", quizWrong: "犬種だけでは足りません", quizExplain: "18,000頭以上が参加した2022年の研究で、犬種が説明した個体の行動差は約9%でした。犬種はヒントにし、目の前の反応を記録しましょう。",
    exploreTitle: "世界の研究カード", exploreLead: "横にスワイプして要点を確認。", takeaway: "飼い主に役立つ一言", openSource: "原文を見る", cautionTitle: "数字の前に、何を測った統計か確認", cautionBody: "論文・標準化質問票・現場テスト・事故届は別の質問に答えます。合格率や事故数を咬傷確率には変換しません。",
    stories: [
      { flag: "🇺🇸", region: "米国 · ゲノム/質問票", badge: "査読研究", stat: "約9%", title: "犬種が説明した個体の行動差", body: "Darwin’s Arkは18,000頭以上の質問票と2,000頭以上のゲノムを組み合わせました。", takeaway: "犬種は弱いヒントで、性格の運命ではありません。", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9675396/", source: "Morrill et al., Science 2022" },
      { flag: "🇺🇸", region: "米国 · 生涯データ", badge: "大規模観察", stat: "47,444", title: "行動の基準線を作った犬の数", body: "恐怖・注意/興奮・攻撃性・訓練性は犬種だけでなく、ライフステージ、性別、去勢状態、体格、生活環境とも関連しました。", takeaway: "普段の基準線があると変化に早く気づけます。", href: "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0330257", source: "Li et al., PLOS ONE 2025" },
      { flag: "🇫🇮", region: "フィンランド · 不安", badge: "査読研究", stat: "32%", title: "騒音感受性が報告された割合", body: "13,700頭で騒音感受性は最も一般的な不安関連特性で、犬種間にも差がありました。", takeaway: "吠えだけでなく、音の後の恐怖と回復時間を見ます。", href: "https://helda.helsinki.fi/items/f36b8096-2d2e-42bd-a8fc-a40eb12b1858", source: "Salonen et al., Scientific Reports 2020" },
      { flag: "🇸🇪", region: "スウェーデン · 現場記述", badge: "標準化記述", stat: "2012–", title: "BPH行動・性格記述", body: "スウェーデンケンネルクラブは設定場面での反応を記述し、飼い主・犬種クラブ・繁殖者を支援します。", takeaway: "一度の合否より、反応と回復の仕方が重要です。", href: "https://www.skk.se/en/about-us3/var-organisation/kommitteer--arbetsgrupper/kommitten-for-hundars-mentalitet/", source: "Swedish Kennel Club" },
      { flag: "🇺🇸", region: "米国 · 気質テスト", badge: "解釈注意", stat: "RAW", title: "ATTS合格率は攻撃性ランキングではない", body: "ATTS自身が公開統計は科学研究ではなく、参加の代表性と犬種母数がないと説明しています。", takeaway: "チワワとピットブルの合格率を咬傷リスクとして比べません。", href: "https://atts.org/breed-statistics/", source: "American Temperament Test Society" },
    ],
  },
};
