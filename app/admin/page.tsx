"use client";

import { useEffect, useMemo, useState } from "react";

type DiaryEntry = {
  id: string;
  caseId: string;
  day: number;
  breed: string;
  note: string;
  comparison: string;
  approachCount: string;
  chewed: string;
  bitterReaction: string;
  adhesion: string;
  petName: string;
  target: string;
  temperamentResult: string;
  helpRequested: boolean;
  hasPhoto: boolean;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type AssessmentEntry = {
  id: string;
  caseId: string;
  assessmentType: "temperament" | "chewing";
  breed: string;
  petName: string;
  language: string;
  answers: string;
  result: string;
  createdAt: string;
  updatedAt: string;
};

type FunnelEvent = {
  id: string;
  caseId: string;
  eventType: string;
  breed: string;
  petName: string;
  dogAge: string;
  chewType: string;
  chewingTarget: string;
  language: string;
  screen: string;
  store: string;
  createdAt: string;
};

type ObservationSession = {
  id: string; caseId: string; breed: string; petName: string; dogAge: string; target: string;
  language: string; status: string; startedAt: string; completedAt: string | null; updatedAt: string;
  reportId: string | null; resultType: string | null; summary: string | null;
};

const funnelStepLabels: [string, string][] = [
  ["app_visit", "전체 방문"],
  ["temperament_start", "기질체크 시작"],
  ["temperament_complete", "기질체크 완료"],
  ["chew_start", "물어뜯기 체크 시작"],
  ["chew_complete", "물어뜯기 체크 완료"],
  ["chew_result_view", "물어뜯기 결과 확인"],
  ["product_view", "제품 화면 진입"],
  ["buy_button_click", "구매 버튼 클릭"],
];

function parseJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

const comparisonLabels: Record<string, string> = {
  much: "많이 줄었어요",
  little: "조금 줄었어요",
  same: "비슷해요",
  worse: "더 심해졌어요",
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [assessments, setAssessments] = useState<AssessmentEntry[]>([]);
  const [events, setEvents] = useState<FunnelEvent[]>([]);
  const [observationSessions, setObservationSessions] = useState<ObservationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/admin/login", {
        cache: "no-store",
      });

      const data = await response.json();

      setAuthenticated(Boolean(data.authenticated));

      if (data.authenticated) {
        await loadEntries();
      }
    } catch {
      setAuthenticated(false);
    }
  }

  async function login(event: React.FormEvent) {
    event.preventDefault();

    setLoginError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error ?? "로그인에 실패했습니다.");
        return;
      }

      setPassword("");
      setAuthenticated(true);

      await loadEntries();
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    setEntries([]);
    setAssessments([]);
    setEvents([]);
    setObservationSessions([]);
    setAuthenticated(false);
  }

  async function loadEntries() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/diary", {
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      const data = await response.json();

      setEntries(data.entries ?? []);
      setAssessments(data.assessments ?? []);
      setEvents(data.events ?? []);
      setObservationSessions(data.observationSessions ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(entry: DiaryEntry) {
    const confirmed = window.confirm(
      `${entry.breed} / Day ${entry.day} 기록을 삭제할까요?\n사진도 함께 삭제됩니다.`,
    );

    if (!confirmed) return;

    const response = await fetch(
      `/api/admin/diary?id=${encodeURIComponent(entry.id)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      alert("삭제하지 못했습니다.");
      return;
    }

    setEntries((current) =>
      current.filter((item) => item.id !== entry.id),
    );
  }

  const filteredEntries = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return entries;

    return entries.filter((entry) => {
      return (
        entry.caseId.toLowerCase().includes(keyword) ||
        entry.breed.toLowerCase().includes(keyword) ||
        entry.petName.toLowerCase().includes(keyword) ||
        entry.target.toLowerCase().includes(keyword) ||
        entry.note.toLowerCase().includes(keyword)
      );
    });
  }, [entries, search]);

  const filteredAssessments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return assessments;
    return assessments.filter((entry) =>
      entry.caseId.toLowerCase().includes(keyword) ||
      entry.breed.toLowerCase().includes(keyword) ||
      entry.petName.toLowerCase().includes(keyword) ||
      entry.assessmentType.toLowerCase().includes(keyword),
    );
  }, [assessments, search]);

  const groupedEntries = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();

    for (const entry of filteredEntries) {
      const group = map.get(entry.caseId) ?? [];
      group.push(entry);
      map.set(entry.caseId, group);
    }

    return Array.from(map.entries()).map(([caseId, items]) => ({
      caseId,
      items: items.sort((a, b) => a.day - b.day),
    }));
  }, [filteredEntries]);

  const funnel = useMemo(() => {
    const uniqueCases = (eventType: string) => new Set(events.filter((event) => event.eventType === eventType).map((event) => event.caseId)).size;
    const steps = funnelStepLabels.map(([eventType, label], index) => {
      const count = uniqueCases(eventType);
      const previous = index === 0 ? count : uniqueCases(funnelStepLabels[index - 1][0]);
      return { eventType, label, count, conversion: index === 0 || previous === 0 ? null : (count / previous) * 100 };
    });
    return {
      steps,
      coupang: uniqueCases("coupang_click"),
      smartstore: uniqueCases("smartstore_click"),
      recent: events.slice(0, 30),
    };
  }, [events]);

  function downloadCsv() {
    const header = [
      "case_id",
      "breed",
      "day",
      "note",
      "day1_comparison",
      "approach_count",
      "chewed",
      "bitter_reaction",
      "adhesion",
      "pet_name",
      "target",
      "temperament_result",
      "help_requested",
      "has_photo",
      "created_at",
      "updated_at",
    ];

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "").replace(/"/g, '""');
      return `"${text}"`;
    };

    const rows = filteredEntries.map((entry) => [
      entry.caseId,
      entry.breed,
      entry.day,
      entry.note,
      entry.comparison,
      entry.approachCount,
      entry.chewed,
      entry.bitterReaction,
      entry.adhesion,
      entry.petName,
      entry.target,
      entry.temperamentResult,
      entry.helpRequested ? "Y" : "N",
      entry.hasPhoto ? "Y" : "N",
      entry.createdAt,
      entry.updatedAt,
    ]);

    const csv = [
      header.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `bittercare-diary-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function downloadAssessmentCsv() {
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = ["case_id", "type", "breed", "pet_name", "language", "answers_json", "result_json", "updated_at"];
    const rows = filteredAssessments.map((entry) => [entry.caseId, entry.assessmentType, entry.breed, entry.petName, entry.language, entry.answers, entry.result, entry.updatedAt]);
    const csv = [header.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bittercare-assessments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (authenticated === null) {
    return (
      <main style={styles.center}>
        <p>확인 중...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main style={styles.center}>
        <form onSubmit={login} style={styles.loginCard}>
          <div style={styles.logo}>BitterCare</div>

          <h1 style={styles.loginTitle}>관리자</h1>

          <p style={styles.loginDescription}>
            관리자 비밀번호를 입력해주세요.
          </p>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="관리자 비밀번호"
            style={styles.input}
            autoFocus
          />

          {loginError && (
            <p style={styles.error}>{loginError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.logo}>BitterCare</div>
            <h1 style={styles.title}>고객 행동 데이터 관리자</h1>
            <p style={styles.subtitle}>
              기질 체크·물어뜯기 성향·비터케어 3일 기록을 참여번호별로 확인합니다.
            </p>
          </div>

          <button onClick={logout} style={styles.secondaryButton}>
            로그아웃
          </button>
        </header>

        <section style={styles.toolbar}>
          <div>
            검사 <strong>{filteredAssessments.length}</strong>건 · 3일 관찰 세션 <strong>{observationSessions.length}</strong>건
          </div>

          <div style={styles.toolbarButtons}>
            <button
              onClick={loadEntries}
              style={styles.secondaryButton}
            >
              새로고침
            </button>

            <button
              onClick={downloadAssessmentCsv}
              style={styles.secondaryButton}
            >
              검사 CSV
            </button>

            <button
              onClick={downloadCsv}
              style={styles.primarySmallButton}
            >
              CSV 다운로드
            </button>
          </div>
        </section>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="이름, 견종, 사용 위치, 참여번호, 메모 검색"
          style={styles.search}
        />

        {loading && <p>불러오는 중...</p>}

        {!loading && events.length > 0 && (
          <section style={styles.funnelSection}>
            <div style={styles.sectionHeading}>
              <div><small style={styles.sectionEyebrow}>PURCHASE FUNNEL</small><h2 style={styles.sectionTitle}>구매 전환 흐름</h2></div>
              <strong style={styles.countBadge}>고유 참여번호 기준</strong>
            </div>
            <div style={styles.funnelGrid}>
              {funnel.steps.map((step, index) => <article key={step.eventType} style={styles.funnelCard}>
                <small style={styles.funnelOrder}>{String(index + 1).padStart(2, "0")}</small>
                <strong style={styles.funnelCount}>{step.count}</strong>
                <span style={styles.funnelLabel}>{step.label}</span>
                <em style={styles.funnelConversion}>{step.conversion === null ? "기준" : `전 단계 대비 ${step.conversion.toFixed(1)}%`}</em>
              </article>)}
            </div>
            <div style={styles.storeSummary}><span>쿠팡 이동 <strong>{funnel.coupang}</strong></span><span>스마트스토어 이동 <strong>{funnel.smartstore}</strong></span></div>
            <details style={styles.recentEvents}><summary>최근 구매 퍼널 이벤트 보기</summary><div>{funnel.recent.map((event) => <p key={event.id}><b>{event.eventType}</b><span>{event.petName || event.breed} · {event.screen}{event.store ? ` · ${event.store}` : ""}</span><time>{new Date(event.createdAt).toLocaleString("ko-KR")}</time></p>)}</div></details>
          </section>
        )}

        {!loading && filteredAssessments.length > 0 && (
          <section style={styles.assessmentSection}>
            <div style={styles.sectionHeading}>
              <div><small style={styles.sectionEyebrow}>ASSESSMENT DATA</small><h2 style={styles.sectionTitle}>기질·물어뜯기 검사 결과</h2></div>
              <strong style={styles.countBadge}>{filteredAssessments.length}건</strong>
            </div>
            <div style={styles.assessmentGrid}>
              {filteredAssessments.map((entry) => {
                const result = parseJson(entry.result);
                const answers = parseJson(entry.answers);
                const isTemperament = entry.assessmentType === "temperament";
                const headline = String(isTemperament ? result.character ?? result.mbtiStyle ?? "기질 결과" : result.title ?? "물어뜯기 결과");
                const code = String(isTemperament ? result.code ?? result.mbtiStyle ?? "" : result.cause ?? "");
                const responseCount = Array.isArray(answers) ? answers.length : Array.isArray(answers.responses) ? answers.responses.length : 0;
                return <article key={entry.id} style={styles.assessmentCard}>
                  <div style={styles.assessmentTop}><span style={isTemperament ? styles.temperamentBadge : styles.chewingBadge}>{isTemperament ? "기질 체크" : "물어뜯기 성향"}</span><time style={styles.assessmentDate}>{new Date(entry.updatedAt).toLocaleString("ko-KR")}</time></div>
                  <h3 style={styles.assessmentTitle}>{headline}</h3>
                  {code && <p style={styles.assessmentCode}>{code}</p>}
                  <div style={styles.assessmentMeta}><span><small>아이</small><b>{entry.petName || "이름 미입력"}</b></span><span><small>견종</small><b>{entry.breed}</b></span><span><small>응답</small><b>{responseCount}개</b></span></div>
                  <div style={styles.caseLine}>참여번호 {entry.caseId}</div>
                  <details style={styles.assessmentDetails}><summary>원본 데이터 보기</summary><pre>{JSON.stringify({ answers, result }, null, 2)}</pre></details>
                </article>;
              })}
            </div>
          </section>
        )}

        {!loading && observationSessions.length > 0 && (
          <section style={styles.assessmentSection}>
            <div style={styles.sectionHeading}><div><small style={styles.sectionEyebrow}>3-DAY REPORTS</small><h2 style={styles.sectionTitle}>3일 관찰 세션·리포트</h2></div><strong style={styles.countBadge}>{observationSessions.length}건</strong></div>
            <div style={styles.assessmentGrid}>{observationSessions.map((session) => <article key={session.id} style={styles.assessmentCard}>
              <div style={styles.assessmentTop}><span style={session.status === "completed" ? styles.temperamentBadge : styles.chewingBadge}>{session.status === "completed" ? "완료" : "진행 중"}</span><time style={styles.assessmentDate}>{new Date(session.updatedAt).toLocaleString("ko-KR")}</time></div>
              <h3 style={styles.assessmentTitle}>{session.petName || "이름 미입력"} · {session.target || "위치 미입력"}</h3>
              <p style={styles.assessmentCode}>{session.resultType ? `리포트: ${session.resultType}` : "기록 진행 중"}</p>
              <div style={styles.assessmentMeta}><span><small>견종</small><b>{session.breed}</b></span><span><small>나이</small><b>{session.dogAge || "-"}</b></span><span><small>언어</small><b>{session.language}</b></span></div>
              {session.summary && <p style={styles.note}>{session.summary}</p>}
              <div style={styles.caseLine}>참여번호 {session.caseId}<br />세션 {session.id}</div>
            </article>)}</div>
          </section>
        )}

        {!loading && groupedEntries.length === 0 && filteredAssessments.length === 0 && events.length === 0 && observationSessions.length === 0 && (
          <div style={styles.empty}>
            저장된 기록이 없습니다.
          </div>
        )}

        <div style={styles.groups}>
          {groupedEntries.map((group) => (
            <section key={group.caseId} style={styles.caseCard}>
              <div style={styles.caseHeader}>
                <div>
                  <div style={styles.caseLabel}>참여번호</div>
                  <div style={styles.caseId}>{group.caseId}</div>
                  <strong>{group.items[0]?.petName || "이름 미입력"}</strong>
                </div>

                <div><div style={styles.breedBadge}>{group.items[0]?.breed ?? "-"} · {group.items[0]?.target || "위치 미입력"}</div>{group.items.some((entry) => entry.helpRequested) && <div style={styles.helpBadge}>도움 요청</div>}</div>
              </div>

              <div style={styles.days}>
                {group.items.map((entry) => (
                  <article key={entry.id} style={styles.dayCard}>
                    <div style={styles.dayTop}>
                      <strong>Day {entry.day}</strong>

                      <button
                        onClick={() => deleteEntry(entry)}
                        style={styles.deleteButton}
                      >
                        삭제
                      </button>
                    </div>

                    {entry.photoUrl && (
                      <a
                        href={entry.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={entry.photoUrl}
                          alt={`Day ${entry.day}`}
                          style={styles.photo}
                        />
                      </a>
                    )}

                    <p style={styles.note}>
                      {entry.note || "기록 내용 없음"}
                    </p>
                    <div style={styles.observationGrid}>
                      <span>접근 <b>{entry.approachCount || "-"}</b></span>
                      <span>물어뜯기 <b>{entry.chewed || "-"}</b></span>
                      <span>쓴맛 반응 <b>{entry.bitterReaction || "-"}</b></span>
                      <span>부착 상태 <b>{entry.adhesion || "-"}</b></span>
                    </div>
                    {entry.comparison && <p style={styles.comparison}>첫째 날 대비 변화: {comparisonLabels[entry.comparison] ?? entry.comparison}</p>}

                    <div style={styles.date}>
                      {new Date(entry.updatedAt).toLocaleString("ko-KR")}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f9",
    color: "#171717",
    padding: "32px 16px 80px",
  },
  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f7f9",
    padding: "24px",
  },
  loginCard: {
    width: "100%",
    maxWidth: "380px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.07)",
  },
  logo: {
    fontWeight: 800,
    fontSize: "20px",
    letterSpacing: "-0.5px",
  },
  loginTitle: {
    fontSize: "28px",
    margin: "28px 0 8px",
  },
  loginDescription: {
    color: "#777",
    marginBottom: "24px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "16px",
    marginBottom: "12px",
  },
  error: {
    color: "#d33",
    fontSize: "14px",
  },
  primaryButton: {
    width: "100%",
    border: 0,
    borderRadius: "12px",
    padding: "14px 18px",
    background: "#171717",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primarySmallButton: {
    border: 0,
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#171717",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#fff",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "28px",
  },
  title: {
    margin: "10px 0 4px",
    fontSize: "30px",
  },
  subtitle: {
    color: "#777",
    margin: 0,
  },
  toolbar: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    marginBottom: "12px",
  },
  toolbarButtons: {
    display: "flex",
    gap: "8px",
  },
  search: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: "15px",
    marginBottom: "22px",
  },
  assessmentSection: {
    marginBottom: "26px",
    padding: "20px",
    border: "1px solid #dce8f7",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #f3f8ff, #ffffff)",
  },
  funnelSection: {
    marginBottom: "26px",
    padding: "20px",
    border: "1px solid #d9e7fb",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #eef6ff, #ffffff)",
  },
  funnelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
    gap: "10px",
  },
  funnelCard: {
    display: "grid",
    gap: "4px",
    minWidth: 0,
    padding: "14px",
    border: "1px solid #dbe7f5",
    borderRadius: "15px",
    background: "#fff",
  },
  funnelOrder: {
    color: "#4b83e8",
    fontSize: "11px",
    fontWeight: 800,
  },
  funnelCount: {
    color: "#102342",
    fontSize: "27px",
    lineHeight: 1.1,
  },
  funnelLabel: {
    color: "#31435c",
    fontSize: "13px",
    fontWeight: 800,
  },
  funnelConversion: {
    color: "#8290a4",
    fontSize: "11px",
    fontStyle: "normal",
  },
  storeSummary: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
    marginTop: "12px",
  },
  recentEvents: {
    marginTop: "14px",
    color: "#51647c",
    fontSize: "12px",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "16px",
  },
  sectionEyebrow: {
    color: "#2475ed",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".12em",
  },
  sectionTitle: {
    margin: "4px 0 0",
    fontSize: "22px",
  },
  countBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    color: "#1268dc",
    background: "#e5f0ff",
    fontSize: "13px",
  },
  assessmentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: "12px",
  },
  assessmentCard: {
    minWidth: 0,
    padding: "16px",
    border: "1px solid #dae5f2",
    borderRadius: "16px",
    background: "#fff",
    boxShadow: "0 5px 16px rgba(35, 78, 130, .05)",
  },
  assessmentTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  temperamentBadge: {
    padding: "6px 9px",
    borderRadius: "999px",
    color: "#087b65",
    background: "#dcf7ef",
    fontSize: "12px",
    fontWeight: 800,
  },
  chewingBadge: {
    padding: "6px 9px",
    borderRadius: "999px",
    color: "#6041c7",
    background: "#eee8ff",
    fontSize: "12px",
    fontWeight: 800,
  },
  assessmentDate: {
    color: "#8390a0",
    fontSize: "11px",
  },
  assessmentTitle: {
    margin: "14px 0 3px",
    color: "#102342",
    fontSize: "20px",
  },
  assessmentCode: {
    margin: 0,
    color: "#2873e4",
    fontSize: "13px",
    fontWeight: 800,
  },
  assessmentMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "7px",
    marginTop: "14px",
  },
  caseLine: {
    marginTop: "12px",
    color: "#7a8797",
    fontSize: "11px",
    wordBreak: "break-all",
  },
  assessmentDetails: {
    marginTop: "12px",
    color: "#51647c",
    fontSize: "12px",
  },
  groups: {
    display: "grid",
    gap: "18px",
  },
  caseCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 3px 18px rgba(0,0,0,0.04)",
  },
  caseHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "16px",
  },
  caseLabel: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "3px",
  },
  caseId: {
    fontSize: "13px",
    wordBreak: "break-all",
  },
  breedBadge: {
    height: "fit-content",
    background: "#f1f2f4",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
  },
  helpBadge: {
    marginTop: "7px",
    background: "#fff0ef",
    color: "#c8362e",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    textAlign: "center",
  },
  days: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  dayCard: {
    border: "1px solid #ececec",
    borderRadius: "14px",
    padding: "12px",
    minWidth: 0,
  },
  dayTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  deleteButton: {
    border: 0,
    background: "transparent",
    color: "#c33",
    cursor: "pointer",
    fontSize: "12px",
  },
  photo: {
    width: "100%",
    aspectRatio: "4 / 3",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "8px",
  },
  note: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "14px",
    lineHeight: 1.55,
    minHeight: "42px",
  },
  observationGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    fontSize: "12px",
    color: "#667085",
  },
  comparison: {
    margin: "8px 0 0",
    padding: "8px 10px",
    borderRadius: "9px",
    background: "#edf4f1",
    color: "#245c4b",
    fontSize: "12px",
    fontWeight: 700,
  },
  date: {
    fontSize: "11px",
    color: "#999",
    marginTop: "10px",
  },
  empty: {
    background: "#fff",
    borderRadius: "18px",
    padding: "50px",
    textAlign: "center",
    color: "#888",
  },
};
