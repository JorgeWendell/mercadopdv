"use server";

import { db } from "@/db";
import { purchasesTable, purchaseItemsTable, productsTable, stockMovementsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { createPurchaseFromNFeSchema } from "./schema";

export async function createPurchaseFromNFe(input: unknown) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({
    headers: cookieStore,
  });

  if (!session?.user) {
    return { success: false, message: "Não autenticado" };
  }

  const validated = createPurchaseFromNFeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, message: "Dados inválidos", errors: validated.error.errors };
  }

  const { supplierId, invoiceNumber, items } = validated.data;

  try {
    const purchaseId = nanoid();
    const totalAmount = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(purchasesTable).values({
        id: purchaseId,
        invoiceNumber: invoiceNumber || null,
        supplierId,
        totalAmount: totalAmount.toFixed(2),
        purchaseDate: now,
        isDraft: false,
        notes: "Entrada via importação de NFe",
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      });

      for (const item of items) {
        const product = await tx
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, item.productId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!product) {
          throw new Error(`Produto ${item.productId} não encontrado`);
        }

        const totalPrice = item.quantity * item.unitPrice;

        await tx.insert(purchaseItemsTable).values({
          id: nanoid(),
          purchaseId,
          productId: item.productId,
          quantity: item.quantity.toFixed(3),
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          createdAt: now,
          updatedAt: now,
        });

        const newStock = Number(product.stock) + item.quantity;

        await tx
          .update(productsTable)
          .set({ 
            stock: newStock.toFixed(3), 
            purchasePrice: item.unitPrice.toFixed(2),
            updatedAt: now 
          })
          .where(eq(productsTable.id, item.productId));

        await tx.insert(stockMovementsTable).values({
          id: nanoid(),
          productId: item.productId,
          type: "IN",
          quantity: item.quantity.toFixed(3),
          previousStock: Number(product.stock).toFixed(3),
          newStock: newStock.toFixed(3),
          reason: `Entrada de mercadoria - NFe ${invoiceNumber || purchaseId}`,
          createdBy: session.user.id,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    return { success: true, purchaseId };
  } catch (error: any) {
    console.error("Erro ao criar entrada via NFe:", error);
    return { success: false, message: error.message || "Erro ao criar entrada" };
  }
}

