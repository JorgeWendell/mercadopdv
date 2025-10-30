"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { inventoryCountsTable, productsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { inventorySubmitCountSchema, type InventorySubmitCountInput } from "./schema";

export async function inventorySubmitCount(input: InventorySubmitCountInput) {
  const parsed = inventorySubmitCountSchema.parse(input);
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
  if (!session?.user) throw new Error("Não autenticado");

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.productId)).limit(1);
  const previous = Number(product?.stock ?? 0);
  const difference = Number((parsed.countedQty - previous).toFixed(3));

  const [existing] = await db
    .select({ id: inventoryCountsTable.id })
    .from(inventoryCountsTable)
    .where(and(eq(inventoryCountsTable.sessionId, parsed.sessionId), eq(inventoryCountsTable.productId, parsed.productId)))
    .limit(1);

  const now = new Date();
  if (existing) {
    await db
      .update(inventoryCountsTable)
      .set({ countedQty: parsed.countedQty.toFixed(3), previousStock: previous.toFixed(3), difference: difference.toFixed(3), updatedAt: now })
      .where(eq(inventoryCountsTable.id, existing.id));
  } else {
    await db.insert(inventoryCountsTable).values({
      id: nanoid(),
      sessionId: parsed.sessionId,
      productId: parsed.productId,
      countedQty: parsed.countedQty.toFixed(3),
      previousStock: previous.toFixed(3),
      difference: difference.toFixed(3),
      createdAt: now,
      updatedAt: now,
    });
  }
  return { success: true };
}


