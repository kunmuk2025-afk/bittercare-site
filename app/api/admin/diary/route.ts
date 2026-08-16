import { isAdminRequest } from "@/lib/admin-auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

type DiaryRow = {
  id: string;
  case_id: string;
  day: number;
  breed: string;
  note: string;
  comparison: string;
  approach_count: string;
  chewed: string;
  bitter_reaction: string;
  adhesion: string;
  pet_name: string;
  target: string;
  temperament_result: string;
  help_requested: number;
  photo_key: string | null;
  photo_type: string | null;
  created_at: number;
  updated_at: number;
};

type AssessmentRow = {
  id: string;
  case_id: string;
  assessment_type: string;
  breed: string;
  pet_name: string;
  language: string;
  answers: string;
  result: string;
  created_at: number;
  updated_at: number;
};

type FunnelEventRow = {
  id: string;
  case_id: string;
  event_type: string;
  breed: string;
  pet_name: string;
  dog_age: string;
  chew_type: string;
  chewing_target: string;
  language: string;
  screen: string;
  store: string;
  created_at: number;
};

type ObservationSessionRow = {
  id: string; case_id: string; breed: string; pet_name: string; dog_age: string; target: string;
  language: string; status: string; started_at: number; completed_at: number | null; updated_at: number;
  report_id: string | null; result_type: string | null; summary: string | null;
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return json({ error: "unauthorized" }, 401);
  }

  const env = getRuntimeEnv();

  const result = await env.DB.prepare(
    `SELECT
       id,
       case_id,
       day,
       breed,
       note,
       comparison,
       approach_count,
       chewed,
       bitter_reaction,
       adhesion,
       pet_name,
       target,
       temperament_result,
       help_requested,
       photo_key,
       photo_type,
       created_at,
       updated_at
     FROM diary_entries
     ORDER BY updated_at DESC
     LIMIT 2000`,
  ).all();

  const assessmentResult = await env.DB.prepare(
    `SELECT id, case_id, assessment_type, breed, pet_name, language, answers, result, created_at, updated_at
     FROM assessment_entries
     ORDER BY updated_at DESC
     LIMIT 2000`,
  ).all<AssessmentRow>();

  const funnelResult = await env.DB.prepare(
    `SELECT id, case_id, event_type, breed, pet_name, dog_age, chew_type, chewing_target, language, screen, store, created_at
     FROM funnel_events
     ORDER BY created_at DESC
     LIMIT 5000`,
  ).all<FunnelEventRow>();

  const observationResult = await env.DB.prepare(
    `SELECT s.id, s.case_id, s.breed, s.pet_name, s.dog_age, s.target, s.language, s.status, s.started_at, s.completed_at, s.updated_at,
            r.id AS report_id, r.result_type, r.summary
     FROM observation_sessions s
     LEFT JOIN observation_reports r ON r.session_id = s.id
     ORDER BY s.updated_at DESC
     LIMIT 2000`,
  ).all<ObservationSessionRow>();

  const entries = result.results.map((row: DiaryRow) => ({
    id: row.id,
    caseId: row.case_id,
    day: row.day,
    breed: row.breed,
    note: row.note,
    comparison: row.comparison,
    approachCount: row.approach_count,
    chewed: row.chewed,
    bitterReaction: row.bitter_reaction,
    adhesion: row.adhesion,
    petName: row.pet_name,
    target: row.target,
    temperamentResult: row.temperament_result,
    helpRequested: Boolean(row.help_requested),
    hasPhoto: Boolean(row.photo_key),
    photoUrl: row.photo_key
      ? `/api/diary/photo/${row.id}?admin=1&v=${row.updated_at}`
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));

  const assessments = assessmentResult.results.map((row: AssessmentRow) => ({
    id: row.id,
    caseId: row.case_id,
    assessmentType: row.assessment_type,
    breed: row.breed,
    petName: row.pet_name,
    language: row.language,
    answers: row.answers,
    result: row.result,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));

  const events = funnelResult.results.map((row: FunnelEventRow) => ({
    id: row.id,
    caseId: row.case_id,
    eventType: row.event_type,
    breed: row.breed,
    petName: row.pet_name,
    dogAge: row.dog_age,
    chewType: row.chew_type,
    chewingTarget: row.chewing_target,
    language: row.language,
    screen: row.screen,
    store: row.store,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  const observationSessions = observationResult.results.map((row) => ({
    id: row.id, caseId: row.case_id, breed: row.breed, petName: row.pet_name, dogAge: row.dog_age,
    target: row.target, language: row.language, status: row.status,
    startedAt: new Date(row.started_at).toISOString(), completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(), reportId: row.report_id, resultType: row.result_type, summary: row.summary,
  }));

  return json({ entries, assessments, events, observationSessions });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) {
    return json({ error: "unauthorized" }, 401);
  }

  const env = getRuntimeEnv();
  const id = new URL(request.url).searchParams.get("id") ?? "";

  if (!/^[a-f0-9-]{20,64}$/i.test(id)) {
    return json({ error: "invalid id" }, 400);
  }

  const existing = await env.DB.prepare(
    `SELECT photo_key
     FROM diary_entries
     WHERE id = ?`,
  )
    .bind(id)
    .first<{ photo_key: string | null }>();

  if (!existing) {
    return json({ error: "not found" }, 404);
  }

  if (existing.photo_key) {
    await env.BUCKET.delete(existing.photo_key);
  }

  await env.DB.prepare(
    `DELETE FROM diary_entries
     WHERE id = ?`,
  )
    .bind(id)
    .run();

  return json({ success: true });
}
