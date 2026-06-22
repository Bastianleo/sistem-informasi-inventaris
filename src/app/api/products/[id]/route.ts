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
    const sku = String(body.sku ?? "").trim().toUpperCase();
    const categoryId = String(body.categoryId ?? "");
    const supplierId = String(body.supplierId ?? "");
    const unit = String(body.unit ?? "pcs").trim();
    const costPrice = Number(body.costPrice);
    const sellPrice = Number(body.sellPrice);
    const minStock = Number(body.minStock);
    const description = body.description ? String(body.description) : null;

    if (!name) return jsonError("Nama produk wajib diisi.");
    if (!sku) return jsonError("SKU wajib diisi.");
    if (!categoryId || !supplierId) {
      return jsonError("Kategori dan supplier wajib dipilih.");
    }
    if ([costPrice, sellPrice, minStock].some((n) => Number.isNaN(n) || n < 0)) {
      return jsonError("Pastikan semua nilai angka valid dan tidak negatif.");
    }

    // Stok tidak diubah lewat form edit produk — gunakan menu Stok Masuk/Keluar.
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        categoryId,
        supplierId,
        unit,
        costPrice,
        sellPrice,
        minStock,
        description,
      },
    });

    return jsonOk(product);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return jsonError("SKU sudah digunakan produk lain.");
      }
      if (err.code === "P2025") {
        return jsonError("Produk tidak ditemukan.", 404);
      }
    }
    console.error(err);
    return jsonError("Gagal memperbarui produk.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;

    // Mutasi stok terkait akan ikut terhapus otomatis (onDelete: Cascade).
    await prisma.product.delete({ where: { id } });
    return jsonOk({ id });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return jsonError("Produk tidak ditemukan.", 404);
    }
    console.error(err);
    return jsonError("Gagal menghapus produk.", 500);
  }
}
