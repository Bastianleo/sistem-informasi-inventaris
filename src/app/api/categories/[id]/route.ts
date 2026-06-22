import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!name) {
      return jsonError("Nama kategori wajib diisi.");
    }

    const duplicate = await prisma.category.findFirst({
      where: { name, id: { not: id } },
    });
    if (duplicate) {
      return jsonError("Nama kategori sudah digunakan.");
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
    });

    return jsonOk(category);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return jsonError("Kategori tidak ditemukan.", 404);
    }
    console.error(err);
    return jsonError("Gagal memperbarui kategori.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      return jsonError(
        "Kategori masih dipakai oleh produk. Pindahkan produk terlebih dahulu."
      );
    }

    await prisma.category.delete({ where: { id } });
    return jsonOk({ id });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return jsonError("Kategori tidak ditemukan.", 404);
    }
    console.error(err);
    return jsonError("Gagal menghapus kategori.", 500);
  }
}
