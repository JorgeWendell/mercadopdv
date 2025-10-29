"use server";

import { cookies } from "next/headers";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";

import { db } from "@/db";
import {
  productsTable,
  saleItemsTable,
  salesTable,
  salePaymentsTable,
  paymentMethodsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export interface SalesDashboardParams {
  startDate?: string;
  endDate?: string;
}

export interface SalesDashboardResponse {
  totalSalesAmount: number;
  totalSalesCount: number;
  averageTicket: number;
  previousTotalSalesAmount: number;
  previousSalesCount: number;
  previousAverageTicket: number;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  topPaymentMethods: { method: string; amount: number; count: number }[];
  hourlySales: { hour: string; amount: number; count: number }[];
  hourlyToday: { hour: string; amount: number; count: number }[];
  dailySales: { date: string; amount: number; count: number }[];
}

export async function getSalesDashboard(params?: SalesDashboardParams): Promise<SalesDashboardResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const now = new Date();
  const start = params?.startDate ? new Date(params.startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = (() => {
    if (params?.endDate) {
      const d = new Date(params.endDate);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  })();

  const where = and(gte(salesTable.saleDate, start), lte(salesTable.saleDate, end));

  const totalsRows = await db
    .select({
      amount: sql<number>`coalesce(sum(${salesTable.finalAmount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(salesTable)
    .where(where);

  const totalSalesAmount = Number(totalsRows[0]?.amount ?? 0);
  const totalSalesCount = Number(totalsRows[0]?.count ?? 0);
  const averageTicket = totalSalesCount > 0 ? Number((totalSalesAmount / totalSalesCount).toFixed(2)) : 0;

  // previous period (same length immediately before start)
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime() + 1) / (24 * 60 * 60 * 1000)));
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - (daysDiff - 1) * 24 * 60 * 60 * 1000);
  const prevWhere = and(gte(salesTable.saleDate, prevStart), lte(salesTable.saleDate, prevEnd));
  const prevTotals = await db
    .select({ amount: sql<number>`coalesce(sum(${salesTable.finalAmount}), 0)`, count: sql<number>`count(*)` })
    .from(salesTable)
    .where(prevWhere);
  const previousTotalSalesAmount = Number(prevTotals[0]?.amount ?? 0);
  const previousSalesCount = Number(prevTotals[0]?.count ?? 0);
  const previousAverageTicket = previousSalesCount > 0 ? Number((previousTotalSalesAmount / previousSalesCount).toFixed(2)) : 0;

  const topRows = await db
    .select({
      productId: saleItemsTable.productId,
      name: productsTable.name,
      qty: sql<number>`sum(${saleItemsTable.quantity})`,
      revenue: sql<number>`sum(${saleItemsTable.totalPrice})`,
    })
    .from(saleItemsTable)
    .innerJoin(salesTable, eq(salesTable.id, saleItemsTable.saleId))
    .leftJoin(productsTable, eq(productsTable.id, saleItemsTable.productId))
    .where(where)
    .groupBy(saleItemsTable.productId, productsTable.name)
    .orderBy(desc(sql`sum(${saleItemsTable.quantity})`))
    .limit(5);

  const topProducts = topRows.map((r) => ({
    productId: r.productId,
    name: r.name ?? "Produto",
    quantity: Number(r.qty),
    revenue: Number(r.revenue),
  }));

  const pmRows = await db
    .select({
      methodId: salePaymentsTable.paymentMethodId,
      methodName: paymentMethodsTable.name,
      amount: sql<number>`sum(${salePaymentsTable.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(salePaymentsTable)
    .innerJoin(salesTable, eq(salesTable.id, salePaymentsTable.saleId))
    .leftJoin(paymentMethodsTable, eq(paymentMethodsTable.id, salePaymentsTable.paymentMethodId))
    .where(where)
    .groupBy(salePaymentsTable.paymentMethodId, paymentMethodsTable.name)
    .orderBy(desc(sql`sum(${salePaymentsTable.amount})`));

  const topPaymentMethods = pmRows.map((r) => ({
    method: r.methodName ?? r.methodId,
    amount: Number(r.amount),
    count: Number(r.count),
  }));

  const hourly = await db
    .select({
      hour: sql<string>`to_char(${salesTable.saleDate}, 'HH24:00')`,
      amount: sql<number>`sum(${salesTable.finalAmount})`,
      count: sql<number>`count(*)`,
    })
    .from(salesTable)
    .where(where)
    .groupBy(sql`to_char(${salesTable.saleDate}, 'HH24:00')`)
    .orderBy(sql`to_char(${salesTable.saleDate}, 'HH24:00')`);

  const hourlySales = hourly.map((r) => ({
    hour: String(r.hour),
    amount: Number(r.amount),
    count: Number(r.count),
  }));

  // Always compute today's hourly regardless of selected period
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const hourlyTodayRows = await db
    .select({
      hour: sql<string>`to_char(${salesTable.saleDate}, 'HH24:00')`,
      amount: sql<number>`sum(${salesTable.finalAmount})`,
      count: sql<number>`count(*)`,
    })
    .from(salesTable)
    .where(and(gte(salesTable.saleDate, todayStart), lte(salesTable.saleDate, todayEnd)))
    .groupBy(sql`to_char(${salesTable.saleDate}, 'HH24:00')`)
    .orderBy(sql`to_char(${salesTable.saleDate}, 'HH24:00')`);
  const hourlyToday = hourlyTodayRows.map((r) => ({ hour: String(r.hour), amount: Number(r.amount), count: Number(r.count) }));

  const daily = await db
    .select({
      day: sql<string>`to_char(${salesTable.saleDate}, 'YYYY-MM-DD')`,
      amount: sql<number>`sum(${salesTable.finalAmount})`,
      count: sql<number>`count(*)`,
    })
    .from(salesTable)
    .where(where)
    .groupBy(sql`to_char(${salesTable.saleDate}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${salesTable.saleDate}, 'YYYY-MM-DD')`);
  const dailySales = daily.map((r) => ({ date: String(r.day), amount: Number(r.amount), count: Number(r.count) }));

  return { totalSalesAmount, totalSalesCount, averageTicket, previousTotalSalesAmount, previousSalesCount, previousAverageTicket, topProducts, topPaymentMethods, hourlySales, hourlyToday, dailySales };
}


