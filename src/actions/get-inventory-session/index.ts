"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { inventoryCountsTable, inventorySessionsTable, productsTable } from "@/db/schema";

export async function getInventorySession(sessionId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
  if (!session?.user) throw new Error("Não autenticado");

  const [sess] = await db
    .select()
    .from(inventorySessionsTable)
    .where(eq(inventorySessionsTable.id, sessionId))
    .limit(1);

  const counts = await db
    .select({
      productId: productsTable.id,
      name: productsTable.name,
      barcode: productsTable.barcode,
      stock: productsTable.stock,
      countedQty: inventoryCountsTable.countedQty,
    })
    .from(productsTable)
    .leftJoin(inventoryCountsTable, eq(inventoryCountsTable.productId, productsTable.id))
    .where(eq(inventoryCountsTable.sessionId, sessionId));

  return { session: sess, counts } as const;
}


