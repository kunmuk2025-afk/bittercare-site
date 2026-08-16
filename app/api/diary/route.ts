import { getRuntimeEnv } from "@/lib/runtime-env";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const CASE_ID_PATTERN = /^[a-f0-9-]{20,64}$/i;

type DiaryRow = {
  id: string;
  day: number;
  note: string;
  comparison: string;
  approach_count: string;
  chewed: string;
  bitter_reaction: string;
  adhesion: string;
  help_requested: number;
  photo_key: string | null;
  updated_at: number;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function validCaseId(value: string) {
  return CASE_ID_PATTERN.test(value);
}

export async function GET(request: Request) {
  const env = getRuntimeEnv();
  const caseId = new URL(request.url).searchParams.get("caseId") ?? "";
  if (!validCaseId(caseId)) return json({ error: "invalid case id" }, 400);

  const result = await env.DB.prepare(
    `SELECT id, day, note, comparison, approach_count, chewed, bitter_reaction, adhesion, help_requested, photo_key, updated_at
     FROM diary_entries
     WHERE case_id = ?
     ORDER BY day ASC`,
  ).bind(caseId).all<DiaryRow>();

  return json({
    entries: result.results.map((row: DiaryRow) => ({
      day: row.day,
      note: row.note,
      comparison: row.comparison,
      approachCount: row.approach_count,
      chewed: row.chewed,
      bitterReaction: row.bitter_reaction,
      adhesion: row.adhesion,
      helpRequested: Boolean(row.help_requested),
      photoUrl: row.photo_key ? `/api/diary/photo/${row.id}` : null,
      savedAt: new Date(row.updated_at).toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const env = getRuntimeEnv();
  const form = await request.formData();
  const caseId = String(form.get("caseId") ?? "");
  const day = Number(form.get("day"));
  const breed = String(form.get("breed") ?? "unknown").slice(0, 50);
  const note = String(form.get("note") ?? "").slice(0, 500);
  const comparison = String(form.get("comparison") ?? "");
  const approachCount = String(form.get("approachCount") ?? "");
  const chewed = String(form.get("chewed") ?? "");
  const bitterReaction = String(form.get("bitterReaction") ?? "");
  const adhesion = String(form.get("adhesion") ?? "");
  const petName = String(form.get("petName") ?? "").slice(0, 30);
  const target = String(form.get("target") ?? "").slice(0, 50);
  const temperamentResult = String(form.get("temperamentResult") ?? "").slice(0, 1000);
  const helpRequested = String(form.get("helpRequested") ?? "") === "true" ? 1 : 0;
  const photoValue = form.get("photo");

  if (!validCaseId(caseId) || !Number.isInteger(day) || day < 1 || day > 5 || !["", "much", "little", "same", "worse"].includes(comparison) || !["0", "1-2", "3-5", "6+"].includes(approachCount) || !["no", "try", "yes"].includes(chewed) || !["avoid", "pause", "weak", "none"].includes(bitterReaction) || !["good", "edge", "loose"].includes(adhesion) || (day === 3 && !comparison)) {
    return json({ error: "invalid diary entry" }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, photo_key FROM diary_entries WHERE case_id = ? AND day = ?",
  ).bind(caseId, day).first<{ id: string; photo_key: string | null }>();

  const id = existing?.id ?? crypto.randomUUID();
  let photoKey = existing?.photo_key ?? null;
  let photoType: string | null = null;

  if (photoValue instanceof File && photoValue.size > 0) {
    if (!photoValue.type.startsWith("image/") || photoValue.size > MAX_PHOTO_BYTES) {
      return json({ error: "invalid photo" }, 400);
    }
    const nextKey = `diary/${caseId}/day-${day}-${Date.now()}`;
    await env.BUCKET.put(nextKey, await photoValue.arrayBuffer(), {
      httpMetadata: { contentType: photoValue.type, cacheControl: "private, max-age=300" },
      customMetadata: { caseId, day: String(day) },
    });
    if (photoKey && photoKey !== nextKey) await env.BUCKET.delete(photoKey);
    photoKey = nextKey;
    photoType = photoValue.type;
  }

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO diary_entries
      (id, case_id, day, breed, note, comparison, approach_count, chewed, bitter_reaction, adhesion, pet_name, target, temperament_result, help_requested, photo_key, photo_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(case_id, day) DO UPDATE SET
       breed = excluded.breed,
       note = excluded.note,
       comparison = excluded.comparison,
       approach_count = excluded.approach_count,
       chewed = excluded.chewed,
       bitter_reaction = excluded.bitter_reaction,
       adhesion = excluded.adhesion,
       pet_name = excluded.pet_name,
       target = excluded.target,
       temperament_result = excluded.temperament_result,
       help_requested = excluded.help_requested,
       photo_key = COALESCE(excluded.photo_key, diary_entries.photo_key),
       photo_type = COALESCE(excluded.photo_type, diary_entries.photo_type),
       updated_at = excluded.updated_at`,
  ).bind(id, caseId, day, breed, note, comparison, approachCount, chewed, bitterReaction, adhesion, petName, target, temperamentResult, helpRequested, photoKey, photoType, now, now).run();

  return json({
    entry: {
      day,
      note,
      comparison,
      approachCount,
      chewed,
      bitterReaction,
      adhesion,
      helpRequested: Boolean(helpRequested),
      photoUrl: photoKey ? `/api/diary/photo/${id}?v=${now}` : null,
      savedAt: new Date(now).toISOString(),
    },
  });
}
