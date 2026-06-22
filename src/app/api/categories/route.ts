import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return jsonOk(categories);
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!name) {
      return jsonError("Nama kategori wajib diisi.");
    }

    const exists = await prisma.category.findFirst({ where: { name } });
    if (exists) {
      return jsonError("Nama kategori sudah digunakan.");
    }

    const category = await prisma.category.create({
      data: { name, description },
    });

    return jsonOk(category, 201);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return jsonError("Nama kategori sudah digunakan.");
    }
    console.error(err);
    return jsonError("Gagal menambahkan kategori.", 500);
  }
}
