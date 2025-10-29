"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";

import { db } from "@/db";
import {
  purchasesTable,
  purchaseItemsTable,
  productsTable,
  stockMovementsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import { createPurchaseSchema } from "./schema";

export async function createPurchase(
  input: z.infer<typeof createPurchaseSchema>
) {
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
    throw new Error("Não autenticado");
  }

  const validatedData = createPurchaseSchema.parse(input);

  const purchaseId = nanoid();
  const purchaseDate = new Date(validatedData.purchaseDate);
  const now = new Date();

  const totalAmount = validatedData.items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  await db.transaction(async (tx) => {
    const [purchase] = await tx
      .insert(purchasesTable)
      .values({
        id: purchaseId,
        invoiceNumber: validatedData.invoiceNumber || null,
        supplierId: validatedData.supplierId,
        totalAmount: totalAmount.toString(),
        purchaseDate: purchaseDate,
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.id,
      })
      .returning();

    for (const item of validatedData.items) {
      const itemId = nanoid();

      await tx.insert(purchaseItemsTable).values({
        id: itemId,
        purchaseId: purchase.id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        batch: item.batch || null,
        expirationDate: item.expirationDate
          ? new Date(item.expirationDate)
          : null,
        manufacturingDate: null,
        createdAt: now,
        updatedAt: now,
      });

      const [product] = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, item.productId))
        .limit(1);

      if (product) {
        const previousStock = Number(product.stock || 0);
        const newStock = previousStock + item.quantity;

        await tx
          .update(productsTable)
          .set({
            stock: newStock.toFixed(3),
            updatedAt: now,
          })
          .where(eq(productsTable.id, item.productId));

        const movementId = nanoid();
        await tx.insert(stockMovementsTable).values({
          id: movementId,
          productId: item.productId,
          type: "entrada",
          quantity: item.quantity.toString(),
          previousStock: previousStock.toFixed(3),
          newStock: newStock.toFixed(3),
          referenceId: purchase.id,
          referenceType: "purchase",
          description: `Entrada via compra - Nota: ${validatedData.invoiceNumber || "N/A"}`,
          createdAt: now,
          createdBy: session.user.id,
        });
      }
    }
  });

  return { success: true, purchaseId };
}

