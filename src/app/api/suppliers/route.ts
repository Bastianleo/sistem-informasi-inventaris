import { NextRequest } from "next/server";

import { requireUser, UnauthorizedError } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  return jsonOk(suppliers);
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (!name || !contactName || !phone || !email || !address) {
      return jsonError("Semua field supplier wajib diisi.");
    }

    const supplier = await prisma.supplier.create({
      data: { name, contactName, phone, email, address },
    });

    return jsonOk(supplier, 201);
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    console.error(err);
    return jsonError("Gagal menambahkan supplier.", 500);
  }
}
