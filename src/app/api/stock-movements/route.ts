import { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

function toClientMovement(m: {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  date: Date;
  note: string | null;
  reference: string | null;
  byName: string;
}) {
  return {
    id: m.id,
    productId: m.productId,
    type: m.type === "IN" ? "in" : "out",
    quantity: m.quantity,
    date: m.date.toISOString(),
    note: m.note ?? undefined,
    reference: m.reference ?? undefined,
    by: m.byName,
  };
}

export async function GET() {
  const movements = await prisma.stockMovement.findMany({
    orderBy: { date: "desc" },
  });
  return jsonOk(movements.map(toClientMovement));
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const body = await request.json();
    const productId = String(body.productId ?? "");
    const type = body.type === "in" ? "IN" : body.type === "out" ? "OUT" : null;
    const quantity = Number(body.quantity);
    const dateInput = body.date ? new Date(body.date) : new Date();
    const note = body.note ? String(body.note).trim() : null;
    const reference = body.reference ? String(body.reference).trim() : null;

    if (!productId) return jsonError("Pilih produk terlebih dahulu.");
    if (!type) return jsonError("Tipe mutasi tidak valid.");
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return jsonError("Jumlah harus berupa angka lebih dari 0.");
    }
    if (Number.isNaN(dateInput.getTime())) {
      return jsonError("Tanggal tidak valid.");
    }

    const movement = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error("Produk tidak ditemukan.");
      }
      if (type === "OUT" && quantity > product.stock) {
        throw new Error(
          `Stok tidak cukup. Sisa stok ${product.name} hanya ${product.stock} ${product.unit}.`
        );
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          stock:
            type === "IN" ? product.stock + quantity : product.stock - quantity,
        },
      });

      return tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          date: dateInput,
          note,
          reference,
          byName: user.name,
        },
      });
    });

    return jsonOk(toClientMovement(movement), 201);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (err instanceof Error) {
      return jsonError(err.message);
    }
    console.error(err);
    return jsonError("Gagal menyimpan mutasi stok.", 500);
  }
}
