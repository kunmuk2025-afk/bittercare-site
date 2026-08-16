import {
  checkAdminPassword,
  createAdminCookie,
  isAdminRequest,
} from "@/lib/admin-auth";

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export async function GET(request: Request) {
  const authenticated = await isAdminRequest(request);

  return json({
    authenticated,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body?.password ?? "");

    if (!password) {
      return json({ error: "비밀번호를 입력해주세요." }, 400);
    }

    const valid = await checkAdminPassword(password);

    if (!valid) {
      return json({ error: "비밀번호가 올바르지 않습니다." }, 401);
    }

    const cookie = await createAdminCookie();

    return json(
      { success: true },
      200,
      {
        "Set-Cookie": cookie,
      },
    );
  } catch {
    return json({ error: "로그인 처리 중 오류가 발생했습니다." }, 500);
  }
}
