"use server";

import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";

import { db } from "@/db";
import {
  salesTable,
  saleItemsTable,
  salePaymentsTable,
  productsTable,
  stockMovementsTable,
  cashMovementsTable,
  paymentMethodsTable,
  cashSessionsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import { createSaleSchema } from "./schema";

export async function createSale(input: z.infer<typeof createSaleSchema>) {
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

  const validatedData = createSaleSchema.parse(input);

  const saleId = nanoid();
  const saleDate = new Date();
  const now = new Date();

  const totalAmount = validatedData.items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  const finalAmount = totalAmount - validatedData.discountAmount;

  await db.transaction(async (tx) => {
    const saleNumber = `V${Date.now()}`;

    const [sale] = await tx
      .insert(salesTable)
      .values({
        id: saleId,
        saleNumber: saleNumber,
        customerId: validatedData.customerId || null,
        totalAmount: totalAmount.toString(),
        discountAmount: validatedData.discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        saleDate: saleDate,
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.id,
      })
      .returning();

    for (const item of validatedData.items) {
      const itemId = nanoid();

      await tx.insert(saleItemsTable).values({
        id: itemId,
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discount: item.discount.toString(),
        totalPrice: item.totalPrice.toString(),
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
        const newStock = previousStock - item.quantity;

        if (newStock < 0) {
          throw new Error(
            `Estoque insuficiente para o produto ${product.name}. Estoque disponível: ${previousStock.toFixed(3)}`
          );
        }

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
          type: "saida",
          quantity: item.quantity.toString(),
          previousStock: previousStock.toFixed(3),
          newStock: newStock.toFixed(3),
          referenceId: sale.id,
          referenceType: "sale",
          description: `Saída via venda - Venda: ${saleNumber}`,
          createdAt: now,
          createdBy: session.user.id,
        });
      }
    }

    const [openCash] = await tx
      .select({ id: cashSessionsTable.id })
      .from(cashSessionsTable)
      .where(and(eq(cashSessionsTable.userId, session.user.id), isNull(cashSessionsTable.closedAt)))
      .limit(1);

    for (const payment of validatedData.payments) {
      const paymentId = nanoid();

      await tx.insert(salePaymentsTable).values({
        id: paymentId,
        saleId: sale.id,
        paymentMethodId: payment.paymentMethodId,
        amount: payment.amount.toString(),
        createdAt: now,
        updatedAt: now,
      });

      const [pm] = await tx
        .select({ name: paymentMethodsTable.name })
        .from(paymentMethodsTable)
        .where(eq(paymentMethodsTable.id, payment.paymentMethodId))
        .limit(1);
      if (pm && openCash?.id) {
        const isCash = pm.name.toLowerCase() === "dinheiro";
        await tx.insert(cashMovementsTable).values({
          id: nanoid(),
          sessionId: openCash.id,
          type: isCash ? "SALE" : "SALE_NONCASH",
          amount: payment.amount.toFixed(2),
          reason: `Venda ${sale.saleNumber} - ${pm.name}`,
          createdAt: now,
          userId: session.user.id,
        } as any);
      }
    }
  });

  return { success: true, saleId };
}

