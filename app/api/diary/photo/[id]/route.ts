import { getRuntimeEnv } from "@/lib/runtime-env";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const env = getRuntimeEnv();
  const { id } = await context.params;
  if (!/^[a-f0-9-]{20,64}$/i.test(id)) return new Response("Not found", { status: 404 });

  const row = await env.DB.prepare(
    "SELECT photo_key, photo_type FROM diary_entries WHERE id = ?",
  ).bind(id).first<{ photo_key: string | null; photo_type: string | null }>();
  if (!row?.photo_key) return new Response("Not found", { status: 404 });

  const object = await env.BUCKET.get(row.photo_key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": row.photo_type ?? object.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
