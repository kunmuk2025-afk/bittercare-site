import { getRuntimeEnv } from "@/lib/runtime-env";

const COOKIE_NAME = "bc_admin";
const SESSION_TEXT = "bittercare-admin-session-v1";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function createSessionToken(password: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(SESSION_TEXT),
  );

  return toHex(signature);
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("Cookie") ?? "";

  for (const item of cookieHeader.split(";")) {
    const [key, ...rest] = item.trim().split("=");

    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export async function checkAdminPassword(password: string) {
  const env = getRuntimeEnv();
  const configuredPassword = env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    throw new Error("ADMIN_PASSWORD secret is not configured.");
  }

  return password === configuredPassword;
}

export async function isAdminRequest(request: Request) {
  const env = getRuntimeEnv();
  const configuredPassword = env.ADMIN_PASSWORD;

  if (!configuredPassword) return false;

  const cookieToken = getCookie(request, COOKIE_NAME);
  if (!cookieToken) return false;

  const expectedToken = await createSessionToken(configuredPassword);

  return cookieToken === expectedToken;
}

export async function createAdminCookie() {
  const env = getRuntimeEnv();
  const configuredPassword = env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    throw new Error("ADMIN_PASSWORD secret is not configured.");
  }

  const token = await createSessionToken(configuredPassword);

  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=28800",
  ].join("; ");
}

export function clearAdminCookie() {
  return [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}
