"use server";

import { cookies } from "next/headers";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  customersTable,
  paymentMethodsTable,
  saleItemsTable,
  salePaymentsTable,
  salesTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export interface GetSalesResponseItem {
  id: string;
  saleNumber: string | null;
  customerName: string | null;
  saleDate: Date;
  finalAmount: number;
  itemsCount: number;
  payments: { method: string; amount: number }[];
}

export interface GetSalesFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMethodId?: string;
}

export interface GetSalesParams {
  filters?: GetSalesFilters;
  page?: number;
  pageSize?: number;
}

export interface GetSalesResponse {
  items: GetSalesResponseItem[];
  total: number;
}

export async function getSales(params?: GetSalesParams): Promise<GetSalesResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const filters = params?.filters;
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? 12);
  const offset = (page - 1) * pageSize;

  const whereClauses = [] as any[];
  if (filters?.startDate) whereClauses.push(sql`${salesTable.saleDate} >= ${new Date(filters.startDate)}`);
  if (filters?.endDate) {
    const d = new Date(filters.endDate);
    d.setHours(23, 59, 59, 999);
    whereClauses.push(sql`${salesTable.saleDate} <= ${d}`);
  }
  if (filters?.customerId) whereClauses.push(eq(salesTable.customerId, filters.customerId));

  const baseSales = db
    .select({
      id: salesTable.id,
      saleNumber: salesTable.saleNumber,
      customerId: salesTable.customerId,
      saleDate: salesTable.saleDate,
      finalAmount: salesTable.finalAmount,
    })
    .from(salesTable);

  // total count
  const totalRows = whereClauses.length
    ? await db.select({ count: sql<number>`count(*)` }).from(salesTable).where(and(...whereClauses))
    : await db.select({ count: sql<number>`count(*)` }).from(salesTable);
  const total = Number(totalRows[0]?.count ?? 0);

  let sales = whereClauses.length
    ? await baseSales.where(and(...whereClauses)).orderBy(desc(salesTable.saleDate)).limit(pageSize).offset(offset)
    : await baseSales.orderBy(desc(salesTable.saleDate)).limit(pageSize).offset(offset);

  if (sales.length === 0) return { items: [], total };

  // If filtering by payment method, restrict to sales that have at least one payment with that method
  if (filters?.paymentMethodId) {
    const saleIdsAll = sales.map((s) => s.id);
    const rows = await db
      .select({ saleId: salePaymentsTable.saleId })
      .from(salePaymentsTable)
      .where(and(inArray(salePaymentsTable.saleId, saleIdsAll), eq(salePaymentsTable.paymentMethodId, filters.paymentMethodId)))
      .groupBy(salePaymentsTable.saleId);
    const allowed = new Set(rows.map((r) => r.saleId));
    sales = sales.filter((s) => allowed.has(s.id));
  }

  if (sales.length === 0) return { items: [], total };

  let saleIds = sales.map((s) => s.id);

  const customerIds = sales
    .map((s) => s.customerId)
    .filter((id): id is string => typeof id === "string");
  const customerById = new Map<string, string>();
  if (customerIds.length > 0) {
    const customers = await db
      .select({ id: customersTable.id, name: customersTable.name })
      .from(customersTable)
      .where(inArray(customersTable.id, customerIds));
    for (const c of customers) customerById.set(c.id, c.name);
  }

  const itemsCounts = await db
    .select({ saleId: saleItemsTable.saleId, count: sql<number>`count(${saleItemsTable.id})` })
    .from(saleItemsTable)
    .where(inArray(saleItemsTable.saleId, saleIds))
    .groupBy(saleItemsTable.saleId);
  const itemsCountBySaleId = new Map(itemsCounts.map((x) => [x.saleId, Number(x.count)]) as [string, number][]);

  let paymentsRaw = await db
    .select({
      saleId: salePaymentsTable.saleId,
      methodId: salePaymentsTable.paymentMethodId,
      amount: salePaymentsTable.amount,
    })
    .from(salePaymentsTable)
    .where(inArray(salePaymentsTable.saleId, saleIds));

  if (filters?.paymentMethodId) {
    paymentsRaw = paymentsRaw.filter((p) => p.methodId === filters.paymentMethodId);
  }

  const methodIds = Array.from(new Set(paymentsRaw.map((p) => p.methodId)));
  const methods = methodIds.length
    ? await db
        .select({ id: paymentMethodsTable.id, name: paymentMethodsTable.name })
        .from(paymentMethodsTable)
        .where(inArray(paymentMethodsTable.id, methodIds))
    : [];
  const methodById = new Map(methods.map((m) => [m.id, m.name] as const));

  const paymentsBySaleId = new Map<string, { method: string; amount: number }[]>();
  for (const p of paymentsRaw) {
    const list = paymentsBySaleId.get(p.saleId) ?? [];
    list.push({ method: methodById.get(p.methodId) || p.methodId, amount: Number(p.amount) });
    paymentsBySaleId.set(p.saleId, list);
  }

  const items = sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber ?? null,
    customerName: s.customerId ? customerById.get(s.customerId) ?? null : null,
    saleDate: s.saleDate,
    finalAmount: Number(s.finalAmount),
    itemsCount: itemsCountBySaleId.get(s.id) ?? 0,
    payments: paymentsBySaleId.get(s.id) ?? [],
  }));

  return { items, total };
}


