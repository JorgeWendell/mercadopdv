"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { productsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { createProductSchema } from "./schema";

export async function createProduct(input: unknown) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const data = createProductSchema.parse(input);

  const now = new Date();
  const id = nanoid();

  await db.insert(productsTable).values({
    id,
    name: data.name,
    description: data.description ?? null,
    barcode: data.barcode ?? null,
    categoryId: data.categoryId,
    supplierId: data.supplierId ?? null,
    unit: data.unit,
    purchasePrice: data.purchasePrice.toString(),
    salePrice: data.salePrice.toString(),
    profitMargin: data.profitMargin?.toString() ?? null,
    stock: (data.stock ?? 0).toFixed(3),
    minStock: data.minStock ? data.minStock.toFixed(3) : "0",
    maxStock: data.maxStock ? data.maxStock.toFixed(3) : null,
    imageUrl: data.imageUrl ?? null,
    active: data.active ?? true,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, id };
}
