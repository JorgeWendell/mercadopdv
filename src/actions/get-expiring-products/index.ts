"use server";

import { db } from "@/db";
import { purchaseItemsTable, productsTable, categoriesTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { and, eq, isNotNull, lte } from "drizzle-orm";

export async function getExpiringProducts(daysThreshold: number = 30) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: cookieHeader,
    }),
  });

  if (!session?.user) {
    return { success: false, message: "Não autenticado" };
  }

  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const items = await db
      .select({
        id: purchaseItemsTable.id,
        productId: purchaseItemsTable.productId,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        batch: purchaseItemsTable.batch,
        quantity: purchaseItemsTable.quantity,
        productStock: productsTable.stock,
        manufacturingDate: purchaseItemsTable.manufacturingDate,
        expirationDate: purchaseItemsTable.expirationDate,
      })
      .from(purchaseItemsTable)
      .leftJoin(productsTable, eq(purchaseItemsTable.productId, productsTable.id))
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(
        and(
          isNotNull(purchaseItemsTable.expirationDate),
          lte(purchaseItemsTable.expirationDate, futureDate)
        )
      );

    const mapped = items
      .map((item) => {
        const expDate = item.expirationDate ? new Date(item.expirationDate) : null;
        const daysUntilExpiry = expDate ? Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
        const status = isExpired ? "EXPIRED" : daysUntilExpiry !== null && daysUntilExpiry <= 7 ? "CRITICAL" : "WARNING";
        const currentStock = Number(item.productStock || 0);

        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName || "Sem nome",
          categoryName: item.categoryName || "-",
          batch: item.batch || "-",
          quantity: Math.min(Number(item.quantity), currentStock),
          currentStock,
          manufacturingDate: item.manufacturingDate,
          expirationDate: item.expirationDate,
          daysUntilExpiry,
          isExpired,
          status,
        };
      })
      .filter((item) => item.currentStock > 0);

    const sorted = mapped.sort((a, b) => {
      if (a.daysUntilExpiry === null) return 1;
      if (b.daysUntilExpiry === null) return -1;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    return { success: true, data: sorted };
  } catch (error) {
    console.error("Erro ao buscar produtos vencidos:", error);
    return { success: false, message: "Erro ao buscar produtos vencidos" };
  }
}

