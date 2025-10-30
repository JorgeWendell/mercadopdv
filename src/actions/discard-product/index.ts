"use server";

import { db } from "@/db";
import { productDiscardsTable, productsTable, stockMovementsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { discardProductSchema } from "./schema";

export async function discardProduct(input: unknown) {
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

  const validated = discardProductSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, message: "Dados inválidos", errors: validated.error.errors };
  }

  const { productId, batchId, quantity, reason, notes } = validated.data;

  try {
    const now = new Date();
    const discardId = nanoid();

    await db.transaction(async (tx) => {
      const product = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      const currentStock = Number(product.stock);
      if (currentStock < quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${currentStock.toFixed(3)}`);
      }

      await tx.insert(productDiscardsTable).values({
        id: discardId,
        productId,
        batchId: batchId || null,
        quantity: quantity.toFixed(3),
        reason,
        notes: notes || null,
        discardedBy: session.user.id,
        discardedAt: now,
        createdAt: now,
      });

      const newStock = currentStock - quantity;

      await tx
        .update(productsTable)
        .set({ stock: newStock.toFixed(3), updatedAt: now })
        .where(eq(productsTable.id, productId));

      await tx.insert(stockMovementsTable).values({
        id: nanoid(),
        productId,
        type: "OUT",
        quantity: quantity.toFixed(3),
        previousStock: currentStock.toFixed(3),
        newStock: newStock.toFixed(3),
        reason: `Descarte - ${reason}${notes ? `: ${notes}` : ""}`,
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      });
    });

    return { success: true, discardId };
  } catch (error: any) {
    console.error("Erro ao descartar produto:", error);
    return { success: false, message: error.message || "Erro ao descartar produto" };
  }
}

