import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  seedCategories,
  seedMovements,
  seedProducts,
  seedSuppliers,
  seedUsers,
} from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Membersihkan data lama...");
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Membuat pengguna...");
  for (const u of seedUsers) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: await bcrypt.hash(u.password, 10),
        role: u.role.toUpperCase() as "ADMIN" | "STAFF",
      },
    });
  }

  console.log("Membuat kategori...");
  for (const c of seedCategories) {
    await prisma.category.create({
      data: { id: c.id, name: c.name, description: c.description },
    });
  }

  console.log("Membuat supplier...");
  for (const s of seedSuppliers) {
    await prisma.supplier.create({
      data: {
        id: s.id,
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        address: s.address,
      },
    });
  }

  console.log("Membuat produk...");
  for (const p of seedProducts) {
    await prisma.product.create({
      data: {
        id: p.id,
        sku: p.sku,
        name: p.name,
        categoryId: p.categoryId,
        supplierId: p.supplierId,
        unit: p.unit,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        stock: p.stock,
        minStock: p.minStock,
        description: p.description ?? null,
        createdAt: new Date(p.createdAt),
      },
    });
  }

  console.log("Membuat riwayat mutasi stok...");
  for (const m of seedMovements) {
    await prisma.stockMovement.create({
      data: {
        id: m.id,
        productId: m.productId,
        type: m.type.toUpperCase() as "IN" | "OUT",
        quantity: m.quantity,
        date: new Date(m.date),
        note: m.note ?? null,
        reference: m.reference ?? null,
        byName: m.by,
      },
    });
  }

  console.log("Seed selesai ✅");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
