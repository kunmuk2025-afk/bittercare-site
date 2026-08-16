import { getRuntimeEnv } from "@/lib/runtime-env";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ID_PATTERN = /^[a-f0-9-]{20,64}$/i;
const LANGS = ["ko", "en", "zh", "ja"];

type EntryRow = {
  id: string; session_id: string; day: number; note: string; comparison: string;
  approach_count: string; chewed: string; bitter_reaction: string; adhesion: string;
  help_requested: number; photo_key: string | null; created_at: number; updated_at: number;
};

type SessionRow = {
  id: string; case_id: string; breed: string; pet_name: string; dog_age: string;
  target: string; temperament_result: string; language: string; status: string;
  started_at: number; completed_at: number | null; created_at: number; updated_at: number;
};

type ReportRow = {
  id: string; session_id: string; result_type: string; summary: string;
  summary_data: string; created_at: number;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function validId(value: string) { return ID_PATTERN.test(value); }

async function ensureProgramSchema(env: ReturnType<typeof getRuntimeEnv>) {
  // V59 safety net: older production D1 databases may not yet have the V58
  // observation tables. These statements are idempotent and keep the 3-day
  // recorder usable even before an explicit migration is applied.
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS observation_sessions (id text PRIMARY KEY NOT NULL, case_id text NOT NULL, breed text NOT NULL, pet_name text DEFAULT '' NOT NULL, dog_age text DEFAULT '' NOT NULL, target text DEFAULT '' NOT NULL, temperament_result text DEFAULT '' NOT NULL, language text DEFAULT 'ko' NOT NULL, status text DEFAULT 'active' NOT NULL, started_at integer NOT NULL, completed_at integer, created_at integer NOT NULL, updated_at integer NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS observation_entries (id text PRIMARY KEY NOT NULL, session_id text NOT NULL, case_id text NOT NULL, day integer NOT NULL, note text DEFAULT '' NOT NULL, comparison text DEFAULT '' NOT NULL, approach_count text DEFAULT '' NOT NULL, chewed text DEFAULT '' NOT NULL, bitter_reaction text DEFAULT '' NOT NULL, adhesion text DEFAULT '' NOT NULL, help_requested integer DEFAULT 0 NOT NULL, photo_key text, photo_type text, created_at integer NOT NULL, updated_at integer NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS observation_reports (id text PRIMARY KEY NOT NULL, session_id text NOT NULL, case_id text NOT NULL, result_type text NOT NULL, summary text NOT NULL, summary_data text NOT NULL, created_at integer NOT NULL)`),
    env.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS observation_session_day_unique ON observation_entries (session_id, day)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS observation_entry_session_idx ON observation_entries (session_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS observation_entry_case_idx ON observation_entries (case_id)`),
    env.DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS observation_report_session_unique ON observation_reports (session_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS observation_report_case_idx ON observation_reports (case_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS observation_session_case_idx ON observation_sessions (case_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS observation_session_status_idx ON observation_sessions (case_id, status)`),
  ]);
}

function entryJson(row: EntryRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    day: row.day,
    note: row.note,
    comparison: row.comparison,
    approachCount: row.approach_count,
    chewed: row.chewed,
    bitterReaction: row.bitter_reaction,
    adhesion: row.adhesion,
    helpRequested: Boolean(row.help_requested),
    photoUrl: row.photo_key ? `/api/program/photo/${row.id}` : null,
    savedAt: new Date(row.updated_at).toISOString(),
  };
}

function reportJson(row: ReportRow | undefined) {
  if (!row) return null;
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(row.summary_data); } catch { data = {}; }
  return {
    id: row.id,
    sessionId: row.session_id,
    resultType: row.result_type,
    summary: row.summary,
    data,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function summaryFor(lang: string, resultType: string, petName: string) {
  const dog = petName.trim() || ({ ko: "우리 아이", en: "Your dog", zh: "爱犬", ja: "愛犬" } as Record<string, string>)[lang];
  const summaries: Record<string, Record<string, string>> = {
    ko: {
      positive: `${dog}는 3일 동안 보호 부위에 대한 접근과 물어뜯기 시도가 함께 줄어드는 흐름이 기록됐어요. 현재 부착 상태를 유지하면서 안전하게 씹을 수 있는 대체 대상을 함께 제공해 주세요.`,
      partial: `일부 행동에서는 변화가 확인됐지만 아직 일정한 흐름은 아니에요. 현재 방법을 유지하면서 조금 더 관찰해보세요.`,
      observe: `3일 동안 큰 변화는 확인되지 않았어요. 물어뜯는 시간과 환경을 함께 살펴보면서 3일을 다시 기록해보는 것도 좋아요.`,
      application: `부착 상태가 일정하지 않아 현재 기록만으로 변화를 판단하기 어려워요. 가장자리가 들뜨지 않았는지 확인한 뒤 다시 관찰해보세요.`,
    },
    en: {
      positive: `${dog} showed a downward trend in both approaching and chewing the protected area. Keep the current setup and continue offering an approved chew.`,
      partial: `Some behaviors changed, but the overall pattern is not consistent yet. Keep the current setup and observe a little longer.`,
      observe: `No clear change was recorded over these three days. Check when and where chewing happens, then consider another three-day observation.`,
      application: `Application was not consistent enough to interpret the trend. Check for lifted edges, reapply, and observe again.`,
    },
    zh: {
      positive: `${dog}在3天内接近保护部位和啃咬尝试都呈下降趋势。请保持当前粘贴状态，并继续提供安全的替代啃咬物。`,
      partial: `部分行为出现变化，但整体趋势还不稳定。请保持当前方法并继续观察。`,
      observe: `这3天尚未记录到明显变化。可结合啃咬发生的时间和环境，再进行一次3天观察。`,
      application: `粘贴状态不够稳定，目前难以判断变化。请检查边缘是否翘起，重新粘贴后再观察。`,
    },
    ja: {
      positive: `${dog}は3日間で、保護した場所への接近と噛む試みがともに減る傾向でした。今の貼り方を保ち、安全に噛める代替品も用意してください。`,
      partial: `一部の行動に変化が見られましたが、まだ一定の傾向ではありません。今の方法を続けてもう少し観察しましょう。`,
      observe: `3日間では大きな変化を確認できませんでした。噛む時間帯と環境を見直し、もう一度3日間記録するのもおすすめです。`,
      application: `貼り付け状態が一定でないため、今回の記録だけでは判断が難しい状態です。端の浮きを直してから再度観察してください。`,
    },
  };
  return (summaries[lang] ?? summaries.ko)[resultType];
}

function buildReport(entries: EntryRow[], language: string, petName: string) {
  const day1 = entries.find((entry) => entry.day === 1)!;
  const day2 = entries.find((entry) => entry.day === 2)!;
  const day3 = entries.find((entry) => entry.day === 3)!;
  const approachRank: Record<string, number> = { "0": 0, "1-2": 1, "3-5": 2, "6+": 3 };
  const chewRank: Record<string, number> = { no: 0, try: 1, yes: 2 };
  const accessTrend = approachRank[day3.approach_count] < approachRank[day1.approach_count] ? "decrease" : approachRank[day3.approach_count] > approachRank[day1.approach_count] ? "increase" : "same";
  const chewingTrend = chewRank[day3.chewed] < chewRank[day1.chewed] ? "decrease" : chewRank[day3.chewed] > chewRank[day1.chewed] ? "increase" : "same";
  const bitterResponse = ["avoid", "pause"].includes(day3.bitter_reaction) ? "confirmed" : day3.bitter_reaction === "weak" ? "weak" : "none";
  const adhesionStatus = day3.adhesion === "good" ? "good" : "check";
  const applicationIssue = entries.some((entry) => entry.adhesion === "loose") || day3.bitter_reaction === "none";
  let resultType = "observe";
  if (applicationIssue) resultType = "application";
  else if ((accessTrend === "decrease" && chewingTrend === "decrease") || day3.comparison === "much") resultType = "positive";
  else if (accessTrend === "decrease" || chewingTrend === "decrease" || day3.comparison === "little") resultType = "partial";

  return {
    resultType,
    summary: summaryFor(language, resultType, petName),
    data: {
      accessTrend,
      chewingTrend,
      bitterResponse,
      adhesionStatus,
      approach: [day1.approach_count, day2.approach_count, day3.approach_count],
      chewing: [day1.chewed, day2.chewed, day3.chewed],
      reaction: [day1.bitter_reaction, day2.bitter_reaction, day3.bitter_reaction],
      adhesion: [day1.adhesion, day2.adhesion, day3.adhesion],
    },
  };
}

export async function GET(request: Request) {
  const env = getRuntimeEnv();
  await ensureProgramSchema(env);
  const caseId = new URL(request.url).searchParams.get("caseId") ?? "";
  if (!validId(caseId)) return json({ error: "invalid case id" }, 400);

  const [sessionsResult, entriesResult, reportsResult] = await Promise.all([
    env.DB.prepare(`SELECT id, case_id, breed, pet_name, dog_age, target, temperament_result, language, status, started_at, completed_at, created_at, updated_at FROM observation_sessions WHERE case_id = ? ORDER BY started_at DESC`).bind(caseId).all<SessionRow>(),
    env.DB.prepare(`SELECT id, session_id, day, note, comparison, approach_count, chewed, bitter_reaction, adhesion, help_requested, photo_key, created_at, updated_at FROM observation_entries WHERE case_id = ? ORDER BY updated_at ASC`).bind(caseId).all<EntryRow>(),
    env.DB.prepare(`SELECT id, session_id, result_type, summary, summary_data, created_at FROM observation_reports WHERE case_id = ? ORDER BY created_at DESC`).bind(caseId).all<ReportRow>(),
  ]);

  const entriesBySession = new Map<string, EntryRow[]>();
  entriesResult.results.forEach((entry) => entriesBySession.set(entry.session_id, [...(entriesBySession.get(entry.session_id) ?? []), entry]));
  const reportBySession = new Map(reportsResult.results.map((report) => [report.session_id, report]));
  return json({
    sessions: sessionsResult.results.map((session) => ({
      id: session.id,
      caseId: session.case_id,
      breed: session.breed,
      petName: session.pet_name,
      dogAge: session.dog_age,
      target: session.target,
      temperamentResult: session.temperament_result,
      language: session.language,
      status: session.status,
      startedAt: new Date(session.started_at).toISOString(),
      completedAt: session.completed_at ? new Date(session.completed_at).toISOString() : null,
      entries: (entriesBySession.get(session.id) ?? []).map(entryJson),
      report: reportJson(reportBySession.get(session.id)),
    })),
  });
}

export async function POST(request: Request) {
  const env = getRuntimeEnv();
  await ensureProgramSchema(env);
  const form = await request.formData();
  const action = String(form.get("action") ?? "save_entry");
  const caseId = String(form.get("caseId") ?? "");
  if (!validId(caseId)) return json({ error: "invalid case id" }, 400);

  if (action === "create_session") {
    const now = Date.now();
    const id = crypto.randomUUID();
    const language = LANGS.includes(String(form.get("language"))) ? String(form.get("language")) : "ko";
    await env.DB.prepare(`INSERT INTO observation_sessions (id, case_id, breed, pet_name, dog_age, target, temperament_result, language, status, started_at, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NULL, ?, ?)`)
      .bind(id, caseId, String(form.get("breed") ?? "unknown").slice(0, 50), String(form.get("petName") ?? "").slice(0, 30), String(form.get("dogAge") ?? "").slice(0, 30), String(form.get("target") ?? "").slice(0, 80), String(form.get("temperamentResult") ?? "").slice(0, 1500), language, now, now, now).run();
    return json({ session: { id, status: "active", startedAt: new Date(now).toISOString(), completedAt: null, entries: [], report: null } }, 201);
  }

  const sessionId = String(form.get("sessionId") ?? "");
  const day = Number(form.get("day"));
  const comparison = String(form.get("comparison") ?? "");
  const approachCount = String(form.get("approachCount") ?? "");
  const chewed = String(form.get("chewed") ?? "");
  const bitterReaction = String(form.get("bitterReaction") ?? "");
  const adhesion = String(form.get("adhesion") ?? "");
  if (!validId(sessionId) || !Number.isInteger(day) || day < 1 || day > 3 || !["", "much", "little", "same", "worse"].includes(comparison) || !["0", "1-2", "3-5", "6+"].includes(approachCount) || !["no", "try", "yes"].includes(chewed) || !["avoid", "pause", "weak", "none"].includes(bitterReaction) || !["good", "edge", "loose"].includes(adhesion) || (day === 3 && !comparison)) return json({ error: "invalid observation entry" }, 400);

  const session = await env.DB.prepare(`SELECT id, pet_name, language FROM observation_sessions WHERE id = ? AND case_id = ?`).bind(sessionId, caseId).first<{ id: string; pet_name: string; language: string }>();
  if (!session) return json({ error: "session not found" }, 404);
  const existing = await env.DB.prepare(`SELECT id, photo_key FROM observation_entries WHERE session_id = ? AND day = ?`).bind(sessionId, day).first<{ id: string; photo_key: string | null }>();
  const id = existing?.id ?? crypto.randomUUID();
  let photoKey = existing?.photo_key ?? null;
  let photoType: string | null = null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/") || photo.size > MAX_PHOTO_BYTES) return json({ error: "invalid photo" }, 400);
    const nextKey = `program/${caseId}/${sessionId}/day-${day}-${Date.now()}`;
    await env.BUCKET.put(nextKey, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type, cacheControl: "private, max-age=300" }, customMetadata: { caseId, sessionId, day: String(day) } });
    if (photoKey && photoKey !== nextKey) await env.BUCKET.delete(photoKey);
    photoKey = nextKey;
    photoType = photo.type;
  }
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO observation_entries (id, session_id, case_id, day, note, comparison, approach_count, chewed, bitter_reaction, adhesion, help_requested, photo_key, photo_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(session_id, day) DO UPDATE SET note = excluded.note, comparison = excluded.comparison, approach_count = excluded.approach_count, chewed = excluded.chewed, bitter_reaction = excluded.bitter_reaction, adhesion = excluded.adhesion, help_requested = excluded.help_requested, photo_key = COALESCE(excluded.photo_key, observation_entries.photo_key), photo_type = COALESCE(excluded.photo_type, observation_entries.photo_type), updated_at = excluded.updated_at`)
    .bind(id, sessionId, caseId, day, String(form.get("note") ?? "").slice(0, 500), comparison, approachCount, chewed, bitterReaction, adhesion, String(form.get("helpRequested") ?? "") === "true" ? 1 : 0, photoKey, photoType, now, now).run();
  await env.DB.prepare(`UPDATE observation_sessions SET updated_at = ? WHERE id = ?`).bind(now, sessionId).run();

  let report: ReturnType<typeof reportJson> = null;
  if (day === 3) {
    const all = await env.DB.prepare(`SELECT id, session_id, day, note, comparison, approach_count, chewed, bitter_reaction, adhesion, help_requested, photo_key, created_at, updated_at FROM observation_entries WHERE session_id = ? AND day BETWEEN 1 AND 3 ORDER BY day ASC`).bind(sessionId).all<EntryRow>();
    if (all.results.length === 3) {
      const built = buildReport(all.results, session.language, session.pet_name);
      const reportId = crypto.randomUUID();
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO observation_reports (id, session_id, case_id, result_type, summary, summary_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET result_type = excluded.result_type, summary = excluded.summary, summary_data = excluded.summary_data, created_at = excluded.created_at`).bind(reportId, sessionId, caseId, built.resultType, built.summary, JSON.stringify(built.data), now),
        env.DB.prepare(`UPDATE observation_sessions SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, sessionId),
      ]);
      const row = await env.DB.prepare(`SELECT id, session_id, result_type, summary, summary_data, created_at FROM observation_reports WHERE session_id = ?`).bind(sessionId).first<ReportRow>();
      report = reportJson(row ?? undefined);
    }
  }

  const row = await env.DB.prepare(`SELECT id, session_id, day, note, comparison, approach_count, chewed, bitter_reaction, adhesion, help_requested, photo_key, created_at, updated_at FROM observation_entries WHERE id = ?`).bind(id).first<EntryRow>();
  return json({ entry: row ? entryJson(row) : null, report });
}
