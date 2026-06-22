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
    const contactName = String(body.contactName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (!name || !contactName || !phone || !email || !address) {
      return jsonError("Semua field supplier wajib diisi.");
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, contactName, phone, email, address },
    });

    return jsonOk(supplier);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return jsonError("Supplier tidak ditemukan.", 404);
    }
    console.error(err);
    return jsonError("Gagal memperbarui supplier.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;

    const productCount = await prisma.product.count({
      where: { supplierId: id },
    });
    if (productCount > 0) {
      return jsonError(
        "Supplier masih dipakai oleh produk. Pindahkan produk terlebih dahulu."
      );
    }

    await prisma.supplier.delete({ where: { id } });
    return jsonOk({ id });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return jsonError("Supplier tidak ditemukan.", 404);
    }
    console.error(err);
    return jsonError("Gagal menghapus supplier.", 500);
  }
}
