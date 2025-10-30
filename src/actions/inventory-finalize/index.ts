"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { inventoryAdjustmentsTable, inventoryCountsTable, inventorySessionsTable, productsTable, stockMovementsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { inventoryFinalizeSchema, type InventoryFinalizeInput } from "./schema";

export async function inventoryFinalize(input: InventoryFinalizeInput) {
  const parsed = inventoryFinalizeSchema.parse(input);
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
  if (!session?.user) throw new Error("Não autenticado");

  const now = new Date();
  await db.transaction(async (tx) => {
    const counts = await tx
      .select({ productId: inventoryCountsTable.productId, countedQty: inventoryCountsTable.countedQty })
      .from(inventoryCountsTable)
      .where(eq(inventoryCountsTable.sessionId, parsed.sessionId));

    for (const c of counts) {
      const counted = Number(c.countedQty || 0);
      const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, c.productId)).limit(1);
      const previous = Number(product?.stock ?? 0);
      const diff = Number((counted - previous).toFixed(3));
      if (diff === 0) continue;

      await tx.update(productsTable).set({ stock: counted.toFixed(3), updatedAt: now }).where(eq(productsTable.id, c.productId));
      await tx.insert(inventoryAdjustmentsTable).values({
        id: nanoid(),
        sessionId: parsed.sessionId,
        productId: c.productId,
        adjustmentQty: diff.toFixed(3),
        createdAt: now,
        createdBy: session.user.id,
      });
      await tx.insert(stockMovementsTable).values({
        id: nanoid(),
        productId: c.productId,
        type: "ajuste_inventario",
        quantity: diff.toFixed(3),
        previousStock: previous.toFixed(3),
        newStock: counted.toFixed(3),
        referenceId: parsed.sessionId,
        referenceType: "inventory",
        description: "Ajuste de inventário",
        createdAt: now,
        createdBy: session.user.id,
      });
    }

    await tx.update(inventorySessionsTable).set({ closedAt: now, updatedAt: now }).where(eq(inventorySessionsTable.id, parsed.sessionId));
  });

  return { success: true };
}


