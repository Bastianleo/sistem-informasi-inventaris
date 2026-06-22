import { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id } });
      if (!movement) {
        throw new Error("Mutasi tidak ditemukan.");
      }

      const product = await tx.product.findUnique({
        where: { id: movement.productId },
      });

      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock:
              movement.type === "IN"
                ? product.stock - movement.quantity
                : product.stock + movement.quantity,
          },
        });
      }

      await tx.stockMovement.delete({ where: { id } });
    });

    return jsonOk({ id });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    if (err instanceof Error) {
      return jsonError(err.message, err.message.includes("tidak ditemukan") ? 404 : 400);
    }
    console.error(err);
    return jsonError("Gagal menghapus mutasi.", 500);
  }
}
