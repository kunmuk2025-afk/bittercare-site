import { clearAdminCookie } from "@/lib/admin-auth";

export async function POST() {
  return Response.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": clearAdminCookie(),
      },
    },
  );
}
