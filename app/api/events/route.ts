import { getRuntimeEnv } from "@/lib/runtime-env";

const CASE_ID_PATTERN = /^[a-f0-9-]{20,64}$/i;
const EVENT_TYPES = new Set([
  "app_visit",
  "temperament_start",
  "temperament_complete",
  "temperament_share_click",
  "temperament_image_save",
  "chew_start",
  "chew_complete",
  "chew_result_view",
  "chew_share_click",
  "chew_image_save",
  "product_view",
  "buy_button_click",
  "coupang_click",
  "smartstore_click",
  "program_start",
]);
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
  const eventType = String(body.eventType ?? "");
  const language = String(body.language ?? "ko");

  if (!CASE_ID_PATTERN.test(caseId) || !EVENT_TYPES.has(eventType) || !LANGUAGES.has(language)) {
    return json({ error: "invalid event" }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const clean = (value: unknown, max = 80) => String(value ?? "").slice(0, max);

  await env.DB.prepare(
    `INSERT INTO funnel_events
      (id, case_id, event_type, breed, pet_name, dog_age, chew_type, chewing_target, language, screen, store, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    caseId,
    eventType,
    clean(body.breed || "unknown", 50),
    clean(body.petName, 30),
    clean(body.dogAge, 30),
    clean(body.chewType, 120),
    clean(body.chewingTarget, 80),
    language,
    clean(body.screen, 40),
    clean(body.store, 30),
    createdAt,
  ).run();

  return json({ success: true, id, createdAt: new Date(createdAt).toISOString() });
}
