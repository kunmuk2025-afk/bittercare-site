import type { LangKey } from "./breed-guides";

type TemperamentCopy = {
  tab: string; hubTitle: string; hubDesc: string; kicker: string; title: string; lead: string;
  guardTitle: string; guardDesc: string; checkTitle: string; checkDesc: string;
  scale: string[]; items: [string, string][]; result: string; notDiagnosis: string; official: string; reset: string;
};

export const temperamentText: Record<LangKey, TemperamentCopy> = {
  ko: {
    tab: "기질 체크", hubTitle: "우리 아이 기질 체크", hubDesc: "16가지 일상 반응으로 4가지 핵심 성향을 살펴봐요.",
    kicker: "1 MIN · 16 QUESTIONS", title: "우리 아이는\n어떤 타입일까요?", lead: "최근 6개월의 평소 모습을 떠올려 가장 가까운 답을 골라주세요.",
    guardTitle: "검사는 행동 성향을 쉽게 이해하기 위한 도구예요", guardDesc: "견종만으로 성격을 정하지 않고, 사람 친화·새로움 반응·에너지·집중 스타일을 실제 일상 반응으로 살펴봅니다.",
    checkTitle: "16가지 일상 반응 체크", checkDesc: "정답은 없어요. 4개 축을 각각 4문항으로 균형 있게 살펴봅니다.",
    scale: ["전혀 아니에요", "드물어요", "가끔 그래요", "자주 그래요", "거의 매번"],
    items: [
      ["새 물건을 먼저 확인하나요?", "집에 처음 보는 물건이 생기면 스스로 다가가 냄새를 맡거나 살펴보는 편인가요?"],
      ["활동 후에도 에너지가 남나요?", "충분히 산책하거나 놀고 난 뒤에도 에너지가 많이 남는 편인가요?"],
      ["처음 보는 사람에게 관심을 보이나요?", "처음 보는 사람이 편안하게 다가오면 먼저 관심을 보이는 편인가요?"],
      ["좋아하는 놀이를 오래 이어가나요?", "관심 있는 장난감이나 놀이를 꽤 오래 이어가는 편인가요?"],
      ["낯선 환경에서 먼저 상황을 살피나요?", "낯선 소리나 환경에서는 한동안 움직이지 않고 상황을 살피는 편인가요?"],
      ["익숙한 사람의 놀이 제안에 쉽게 참여하나요?", "익숙한 사람이 말을 걸거나 놀자고 하면 쉽게 함께하는 편인가요?"],
      ["활동이 끝나면 금방 쉬나요?", "산책이나 놀이가 끝나면 비교적 금방 자리를 잡고 쉬는 편인가요?"],
      ["다른 재미가 생기면 관심을 쉽게 옮기나요?", "새로운 재미있는 것이 나타나면 하던 행동에서 쉽게 관심을 옮기는 편인가요?"],
      ["새로운 장소를 탐색하나요?", "처음 가는 장소에서도 주변을 돌아보며 탐색하기 시작하는 편인가요?"],
      ["놀이가 끝나도 다음 활동을 찾나요?", "신나는 놀이가 끝난 뒤에도 금방 다음 활동을 찾는 편인가요?"],
      ["낯선 사람과 친해지는 데 시간이 필요한가요?", "낯선 사람과 편안해지기까지 비교적 시간이 필요한 편인가요?"],
      ["새로운 행동 연습에 집중하나요?", "새로운 행동을 연습할 때 한 가지 과제에 집중하는 편인가요?"],
      ["먼저 놀이를 시작하나요?", "집에서도 먼저 장난감이나 놀이를 시작하는 일이 많은 편인가요?"],
      ["새로운 냄새나 물건을 직접 확인하나요?", "새로운 냄새나 흥미로운 물건을 발견하면 직접 확인하려는 편인가요?"],
      ["여러 사람 속에서도 편안한가요?", "여러 사람이 함께 있는 공간에서도 사람 곁에서 편안하게 지내는 편인가요?"],
      ["관심 가진 대상을 다시 찾나요?", "한번 관심을 가진 대상은 시간이 지나도 다시 찾아가는 편인가요?"],
    ],
    result: "우리 아이 TYPE", notDiagnosis: "이 결과는 행동 성향을 이해하기 위한 간단한 체크이며 진단이나 사람 MBTI 검사가 아닙니다.", official: "연구 기반 설명 보기", reset: "다시 체크하기",
  },
  en: {
    tab: "Temperament", hubTitle: "Your dog's temperament", hubDesc: "16 everyday reactions across four core behavior dimensions.",
    kicker: "1 MIN · 16 QUESTIONS", title: "What kind of\npup are you living with?", lead: "Think about your dog's usual behavior over the last six months.",
    guardTitle: "A simple way to understand behavior style", guardDesc: "We do not define personality by breed. We look at social approach, novelty response, energy and attention style through everyday behavior.",
    checkTitle: "16 everyday reactions", checkDesc: "No right answers—four balanced questions for each of four dimensions.",
    scale: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
    items: [
      ["Checks out new objects first?", "When an unfamiliar object appears at home, does your dog approach and inspect it?"],
      ["Still energetic after activity?", "After a good walk or play session, does your dog still have plenty of energy?"],
      ["Interested in new people?", "When a new person approaches calmly, does your dog show interest first?"],
      ["Keeps favorite play going?", "Does your dog stay with a favorite toy or game for quite a while?"],
      ["Pauses to assess unfamiliar settings?", "In an unfamiliar sound or setting, does your dog pause and watch before moving?"],
      ["Joins familiar people easily?", "When a familiar person invites play or interaction, does your dog join readily?"],
      ["Settles quickly after activity?", "After a walk or play, does your dog settle down fairly quickly?"],
      ["Switches attention when something new appears?", "Does your dog easily move attention to a new interesting thing?"],
      ["Explores new places?", "In a new place, does your dog start exploring the surroundings?"],
      ["Looks for the next activity?", "After exciting play ends, does your dog quickly seek another activity?"],
      ["Needs time to warm up to strangers?", "Does your dog usually need time before feeling comfortable with a stranger?"],
      ["Focuses on a new task?", "When learning a new behavior, can your dog stay with one task?"],
      ["Starts play on their own?", "At home, does your dog often initiate play or bring a toy first?"],
      ["Investigates new scents or objects?", "Does your dog actively check out a new scent or interesting object?"],
      ["Comfortable around groups of people?", "Can your dog stay relaxed near people when several are together?"],
      ["Returns to things that caught attention?", "After some time passes, does your dog return to an object that previously held interest?"],
    ],
    result: "YOUR DOG TYPE", notDiagnosis: "This is a simple behavior-style check, not a diagnosis or a human MBTI assessment.", official: "About the research basis", reset: "Check again",
  },
  zh: {
    tab: "气质检查", hubTitle: "爱犬气质检查", hubDesc: "用16种日常反应观察4个核心行为维度。", kicker: "1分钟 · 16题", title: "爱犬属于\n哪种类型？", lead: "请回想最近6个月的日常表现，选择最接近的答案。",
    guardTitle: "用简单方式理解行为风格", guardDesc: "不以犬种决定性格，而是通过日常反应观察亲人程度、新事物反应、能量与专注风格。", checkTitle: "16种日常反应", checkDesc: "没有正确答案，每个维度用4道题均衡观察。", scale: ["完全不是", "很少", "有时", "经常", "几乎每次"],
    items: [["会先确认新物品吗？","家里出现新物品时，会主动靠近闻一闻或查看吗？"],["活动后仍精力充沛吗？","充分散步或玩耍后，仍有很多精力吗？"],["会对陌生人感兴趣吗？","陌生人平静靠近时，会先表现出兴趣吗？"],["喜欢的游戏会持续较久吗？","会较长时间持续喜欢的玩具或游戏吗？"],["陌生环境会先观察吗？","面对陌生声音或环境，会先停下来观察情况吗？"],["熟悉的人邀请时容易参与吗？","熟悉的人说话或邀请玩耍时，会很快加入吗？"],["活动后很快休息吗？","散步或游戏结束后，会较快安静休息吗？"],["有新乐趣时容易转移注意吗？","出现新的有趣事物时，会容易转移注意吗？"],["会探索新地点吗？","到第一次去的地方，会开始四处探索吗？"],["游戏结束后会找下一项活动吗？","兴奋游戏结束后，会马上寻找下一项活动吗？"],["和陌生人熟悉需要时间吗？","与陌生人相处到放松通常需要时间吗？"],["学习新动作时能专注吗？","练习新动作时，能专注在一个任务上吗？"],["会主动开始游戏吗？","在家会主动拿玩具或发起游戏吗？"],["会主动确认新气味或物品吗？","发现新的气味或有趣物品时，会主动确认吗？"],["在人多时也放松吗？","多人在一起时，也能在人旁边舒服地待着吗？"],["会再次寻找感兴趣的对象吗？","曾经感兴趣的对象，过一段时间还会再去找吗？"]],
    result: "爱犬 TYPE", notDiagnosis: "该结果用于轻松理解行为风格，不是诊断，也不是人的MBTI测试。", official: "了解研究依据", reset: "重新检查",
  },
  ja: {
    tab: "気質チェック", hubTitle: "愛犬の気質チェック", hubDesc: "16の日常反応から4つの行動軸を見ます。", kicker: "1分 · 16問", title: "うちの子は\nどんなタイプ？", lead: "直近6か月の普段の様子を思い出して選んでください。",
    guardTitle: "行動スタイルを気軽に理解するチェック", guardDesc: "犬種で性格を決めず、人への親しみ・新しさへの反応・エネルギー・集中スタイルを日常行動から見ます。", checkTitle: "16の日常反応", checkDesc: "正解はありません。4軸を各4問でバランスよく確認します。", scale: ["まったくない", "まれ", "ときどき", "よくある", "ほぼ毎回"],
    items: [["新しい物を先に確かめますか？","家に初めて見る物があると、自分から近づいて匂いや様子を確かめますか？"],["活動後もエネルギーが残りますか？","十分に散歩や遊びをした後も元気が多く残りますか？"],["初対面の人に興味を示しますか？","初めての人が穏やかに近づくと、先に関心を示しますか？"],["好きな遊びを長く続けますか？","好きなおもちゃや遊びを比較的長く続けますか？"],["慣れない環境では先に様子を見ますか？","慣れない音や場所では、しばらく止まって状況を見ますか？"],["慣れた人の誘いに参加しやすいですか？","慣れた人が遊びに誘うと、すぐ一緒に参加しますか？"],["活動後すぐ休めますか？","散歩や遊びの後、比較的すぐ落ち着いて休みますか？"],["別の楽しさへ関心を移しやすいですか？","新しく面白いものが現れると、していたことから関心を移しやすいですか？"],["新しい場所を探索しますか？","初めての場所でも周囲を歩いて探索し始めますか？"],["遊びの後に次の活動を探しますか？","楽しい遊びが終わると、すぐ次の活動を探しますか？"],["初対面の人に慣れるまで時間が必要ですか？","知らない人と安心して過ごすまで時間がかかりますか？"],["新しい行動の練習に集中しますか？","新しい行動を練習するとき、一つの課題に集中できますか？"],["自分から遊びを始めますか？","家で自分からおもちゃを持ってきたり遊びを始めますか？"],["新しい匂いや物を自分で確かめますか？","新しい匂いや興味深い物を見つけると、自分から確認しますか？"],["人が多くても落ち着けますか？","複数の人がいる場所でも、人のそばで落ち着いて過ごせますか？"],["気になった対象をまた探しますか？","一度興味を持った対象を、時間が経ってもまた探しに行きますか？"]],
    result: "うちの子 TYPE", notDiagnosis: "行動スタイルをわかりやすく見る簡易チェックで、診断や人のMBTI検査ではありません。", official: "研究ベースを見る", reset: "もう一度チェック",
  },
};
