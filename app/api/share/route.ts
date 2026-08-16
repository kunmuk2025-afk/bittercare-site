import { getRuntimeEnv } from "@/lib/runtime-env";

const LANGS = ["ko","en","zh","ja"];
const KINDS = ["temperament","chewing"];
const ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function ensureSchema(env: ReturnType<typeof getRuntimeEnv>) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS share_results (
      id text PRIMARY KEY NOT NULL,
      kind text NOT NULL,
      language text DEFAULT 'ko' NOT NULL,
      pet_name text DEFAULT '' NOT NULL,
      result_title text NOT NULL,
      hook text DEFAULT '' NOT NULL,
      description text DEFAULT '' NOT NULL,
      mbti text DEFAULT '' NOT NULL,
      breed_image_src text DEFAULT '' NOT NULL,
      breed_image_position text DEFAULT '50% 50%' NOT NULL,
      axes_json text DEFAULT '[]' NOT NULL,
      created_at integer NOT NULL,
      expires_at integer NOT NULL
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS share_results_expires_idx ON share_results (expires_at)`),
  ]);
}

function safeText(value: unknown, max = 300) { return String(value ?? "").slice(0, max); }

export async function POST(request: Request) {
  const env = getRuntimeEnv();
  await ensureSchema(env);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !KINDS.includes(String(body.kind))) return json({ error: "invalid share result" }, 400);
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = Date.now();
  const expires = now + 1000 * 60 * 60 * 24 * 90;
  const lang = LANGS.includes(String(body.lang)) ? String(body.lang) : "ko";
  const axes = Array.isArray(body.axes) ? body.axes.slice(0, 8).map((a) => ({
    label: safeText((a as Record<string, unknown>).label, 40),
    score: Math.max(0, Math.min(100, Number((a as Record<string, unknown>).score) || 0)),
    level: safeText((a as Record<string, unknown>).level, 30),
  })) : [];
  await env.DB.prepare(`INSERT INTO share_results (id, kind, language, pet_name, result_title, hook, description, mbti, breed_image_src, breed_image_position, axes_json, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, String(body.kind), lang, safeText(body.petName, 30), safeText(body.resultTitle, 120), safeText(body.hook, 300), safeText(body.description, 800), safeText(body.mbti, 12), safeText(body.breedImageSrc, 250), safeText(body.breedImagePosition, 40), JSON.stringify(axes), now, expires).run();
  return json({ id, url: `https://app.bittercare.com/share/${id}` }, 201);
}

export async function GET(request: Request) {
  const env = getRuntimeEnv();
  await ensureSchema(env);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!ID_PATTERN.test(id)) return json({ error: "invalid id" }, 400);
  const row = await env.DB.prepare(`SELECT id, kind, language, pet_name, result_title, hook, description, mbti, breed_image_src, breed_image_position, axes_json, created_at, expires_at FROM share_results WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  if (!row || Number(row.expires_at) < Date.now()) return json({ error: "not found" }, 404);
  let axes: unknown[] = []; try { axes = JSON.parse(String(row.axes_json)); } catch {}
  return json({ id: row.id, kind: row.kind, lang: row.language, petName: row.pet_name, resultTitle: row.result_title, hook: row.hook, description: row.description, mbti: row.mbti, breedImageSrc: row.breed_image_src, breedImagePosition: row.breed_image_position, axes, createdAt: new Date(Number(row.created_at)).toISOString() });
}
