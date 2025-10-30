"use server";

import { db } from "@/db";
import { purchasesTable, purchaseItemsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { createDraftPurchaseSchema } from "./schema";

export async function createDraftPurchase(input: unknown) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({
    headers: cookieStore,
  });

  if (!session?.user) {
    return { success: false, message: "Não autenticado" };
  }

  const validated = createDraftPurchaseSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, message: "Dados inválidos", errors: validated.error.errors };
  }

  const { supplierId, items, notes } = validated.data;

  try {
    const purchaseId = nanoid();
    const totalAmount = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(purchasesTable).values({
        id: purchaseId,
        supplierId,
        totalAmount: totalAmount.toFixed(2),
        purchaseDate: now,
        notes: notes || null,
        isDraft: true,
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      });

      for (const item of items) {
        await tx.insert(purchaseItemsTable).values({
          id: nanoid(),
          purchaseId,
          productId: item.productId,
          quantity: item.quantity.toFixed(3),
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: (item.quantity * item.unitPrice).toFixed(2),
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    return { success: true, purchaseId };
  } catch (error) {
    console.error("Erro ao criar pré-pedido:", error);
    return { success: false, message: "Erro ao criar pré-pedido" };
  }
}

