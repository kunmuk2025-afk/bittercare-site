import { getRuntimeEnv } from "@/lib/runtime-env";

const CASE_ID_PATTERN = /^[a-f0-9-]{20,64}$/i;
const TYPES = new Set(["temperament", "chewing"]);
const LANGUAGES = new Set(["ko", "en", "zh", "ja"]);

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const env = getRuntimeEnv();
  let body: Record<string, unknown>;

  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const caseId = String(body.caseId ?? "");
  const assessmentType = String(body.assessmentType ?? "");
  const breed = String(body.breed ?? "unknown").slice(0, 50);
  const petName = String(body.petName ?? "").slice(0, 30);
  const language = String(body.language ?? "ko");
  const answers = JSON.stringify(body.answers ?? []).slice(0, 8000);
  const result = JSON.stringify(body.result ?? {}).slice(0, 12000);

  if (!CASE_ID_PATTERN.test(caseId) || !TYPES.has(assessmentType) || !LANGUAGES.has(language) || answers.length < 2 || result.length < 2) {
    return json({ error: "invalid assessment" }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, created_at FROM assessment_entries WHERE case_id = ? AND assessment_type = ?",
  ).bind(caseId, assessmentType).first<{ id: string; created_at: number }>();

  const id = existing?.id ?? crypto.randomUUID();
  const now = Date.now();
  const createdAt = existing?.created_at ?? now;

  await env.DB.prepare(
    `INSERT INTO assessment_entries
      (id, case_id, assessment_type, breed, pet_name, language, answers, result, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(case_id, assessment_type) DO UPDATE SET
       breed = excluded.breed,
       pet_name = excluded.pet_name,
       language = excluded.language,
       answers = excluded.answers,
       result = excluded.result,
       updated_at = excluded.updated_at`,
  ).bind(id, caseId, assessmentType, breed, petName, language, answers, result, createdAt, now).run();

  return json({ success: true, id, updatedAt: new Date(now).toISOString() });
}
