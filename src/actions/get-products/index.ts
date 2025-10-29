"use server";

import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  productsTable,
  categoriesTable,
  suppliersTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getProducts() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      barcode: productsTable.barcode,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      supplierId: productsTable.supplierId,
      supplierName: suppliersTable.name,
      unit: productsTable.unit,
      purchasePrice: productsTable.purchasePrice,
      salePrice: productsTable.salePrice,
      profitMargin: productsTable.profitMargin,
      stock: productsTable.stock,
      minStock: productsTable.minStock,
      maxStock: productsTable.maxStock,
      imageUrl: productsTable.imageUrl,
      active: productsTable.active,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .leftJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id)
    )
    .leftJoin(
      suppliersTable,
      eq(productsTable.supplierId, suppliersTable.id)
    )
    .orderBy(desc(productsTable.createdAt));

  return products;
}
