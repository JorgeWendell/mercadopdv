"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  customersTable,
  paymentMethodsTable,
  productsTable,
  saleItemsTable,
  salePaymentsTable,
  salesTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export interface GetSaleResponse {
  id: string;
  saleNumber: string | null;
  customerName: string | null;
  saleDate: Date;
  total: number;
  items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
  payments: { method: string; amount: number }[];
}

export async function getSale(saleId: string): Promise<GetSaleResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const [sale] = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.id, saleId))
    .limit(1);
  if (!sale) throw new Error("Venda não encontrada");

  let customerName: string | null = null;
  if (sale.customerId) {
    const [customer] = await db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, sale.customerId))
      .limit(1);
    customerName = customer?.name ?? null;
  }

  const itemsRaw = await db
    .select({
      productName: productsTable.name,
      quantity: saleItemsTable.quantity,
      unitPrice: saleItemsTable.unitPrice,
      totalPrice: saleItemsTable.totalPrice,
    })
    .from(saleItemsTable)
    .leftJoin(productsTable, eq(productsTable.id, saleItemsTable.productId))
    .where(eq(saleItemsTable.saleId, saleId));

  const items = itemsRaw.map((i) => ({
    name: i.productName ?? "Produto",
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    subtotal: Number(i.totalPrice),
  }));

  const paymentsRaw = await db
    .select({
      methodId: salePaymentsTable.paymentMethodId,
      amount: salePaymentsTable.amount,
      methodName: paymentMethodsTable.name,
    })
    .from(salePaymentsTable)
    .leftJoin(paymentMethodsTable, eq(paymentMethodsTable.id, salePaymentsTable.paymentMethodId))
    .where(eq(salePaymentsTable.saleId, saleId));

  const payments = paymentsRaw.map((p) => ({
    method: p.methodName ?? p.methodId,
    amount: Number(p.amount),
  }));

  return {
    id: sale.id,
    saleNumber: sale.saleNumber ?? null,
    customerName,
    saleDate: sale.saleDate,
    total: Number(sale.finalAmount),
    items,
    payments,
  };
}


