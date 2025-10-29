"use server";

import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  purchasesTable,
  suppliersTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getPurchases() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const purchases = await db
    .select({
      id: purchasesTable.id,
      invoiceNumber: purchasesTable.invoiceNumber,
      supplierId: purchasesTable.supplierId,
      supplierName: suppliersTable.name,
      totalAmount: purchasesTable.totalAmount,
      purchaseDate: purchasesTable.purchaseDate,
      createdAt: purchasesTable.createdAt,
      updatedAt: purchasesTable.updatedAt,
    })
    .from(purchasesTable)
    .leftJoin(
      suppliersTable,
      eq(purchasesTable.supplierId, suppliersTable.id)
    )
    .orderBy(desc(purchasesTable.createdAt));

  return purchases;
}

