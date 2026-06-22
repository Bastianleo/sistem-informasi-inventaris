import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-response";
// verifyPassword dikomentari karena kita beralih ke plain text sementara waktu
// import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; remember?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonError("Format permintaan tidak valid.");
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return jsonError("Email dan kata sandi wajib diisi.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return jsonError("Email tidak ditemukan.", 401);
  }

  // ================================================================
  // BYPASS VERIFIKASI: Menggunakan perbandingan teks biasa (Plain Text)
  // ================================================================
  const valid = password === user.password;
  if (!valid) {
    return jsonError("Kata sandi salah.", 401);
  }

  const { token, maxAgeSeconds } = await createSessionToken(
    { userId: user.id },
    !!body.remember
  );

  const response = jsonOk({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
  });

  return response;
}