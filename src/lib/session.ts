import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "stokly_session";

const SHORT_SESSION_SECONDS = 60 * 60 * 24; // 1 hari
const REMEMBER_SESSION_SECONDS = 60 * 60 * 24 * 30; // 30 hari

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET belum diatur. Tambahkan AUTH_SECRET di file .env Anda."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
}

export async function createSessionToken(
  payload: SessionPayload,
  remember: boolean
) {
  const maxAgeSeconds = remember
    ? REMEMBER_SESSION_SECONDS
    : SHORT_SESSION_SECONDS;

  const token = await new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(getSecretKey());

  return { token, maxAgeSeconds: remember ? maxAgeSeconds : undefined };
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
