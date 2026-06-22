import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return jsonOk(products);
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "").trim().toUpperCase();
    const categoryId = String(body.categoryId ?? "");
    const supplierId = String(body.supplierId ?? "");
    const unit = String(body.unit ?? "pcs").trim();
    const costPrice = Number(body.costPrice);
    const sellPrice = Number(body.sellPrice);
    const minStock = Number(body.minStock);
    const stock = Number(body.stock ?? 0);
    const description = body.description ? String(body.description) : null;

    if (!name) return jsonError("Nama produk wajib diisi.");
    if (!sku) return jsonError("SKU wajib diisi.");
    if (!categoryId || !supplierId) {
      return jsonError("Kategori dan supplier wajib dipilih.");
    }
    if (
      [costPrice, sellPrice, minStock, stock].some(
        (n) => Number.isNaN(n) || n < 0
      )
    ) {
      return jsonError("Pastikan semua nilai angka valid dan tidak negatif.");
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        supplierId,
        unit,
        costPrice,
        sellPrice,
        minStock,
        stock,
        description,
      },
    });

    return jsonOk(product, 201);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return jsonError("SKU sudah digunakan produk lain.");
    }
    console.error(err);
    return jsonError("Gagal menambahkan produk.", 500);
  }
}
