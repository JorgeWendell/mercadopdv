"use server";

import { cookies } from "next/headers";
import { between, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { cashMovementsTable, cashSessionsTable, usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cashReportSchema, type CashReportInput } from "./schema";

export async function getCashReport(input: CashReportInput) {
  const parsed = cashReportSchema.parse({
    start: new Date(input.start),
    end: new Date(input.end),
    operatorId: input.operatorId,
    paymentMethodName: input.paymentMethodName?.trim() || undefined,
  });
  parsed.end.setHours(23, 59, 59, 999);

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
  if (!session?.user) throw new Error("Não autenticado");

  let sessions = await db
    .select({
      id: cashSessionsTable.id,
      openedAt: cashSessionsTable.openedAt,
      closedAt: cashSessionsTable.closedAt,
      openingAmount: cashSessionsTable.openingAmount,
      closingAmount: cashSessionsTable.closingAmount,
      userId: cashSessionsTable.userId,
    })
    .from(cashSessionsTable)
    .where(between(cashSessionsTable.openedAt, parsed.start, parsed.end))
    .orderBy(desc(cashSessionsTable.openedAt));

  if (parsed.operatorId) {
    sessions = sessions.filter((s) => s.userId === parsed.operatorId);
  }

  const byId: Record<string, any> = {};
  for (const s of sessions) {
    byId[s.id] = {
      ...s,
      opening: Number(s.openingAmount ?? 0),
      closing: Number(s.closingAmount ?? 0),
      in: 0,
      out: 0,
      expected: 0,
      difference: 0,
      userName: "",
    };
  }

  if (sessions.length === 0) return [] as const;

  const movements = await db
    .select({ sessionId: cashMovementsTable.sessionId, type: cashMovementsTable.type, amount: cashMovementsTable.amount, reason: cashMovementsTable.reason })
    .from(cashMovementsTable)
    .where(between(cashMovementsTable.createdAt, parsed.start, parsed.end));

  for (const m of movements) {
    const row = byId[m.sessionId];
    if (!row) continue;
    const val = Number(m.amount ?? 0);
    if (m.type === "IN" || m.type === "SALE" || m.type === "SALE_NONCASH") row.in += val;
    if (m.type === "OUT" || m.type === "REFUND") row.out += val;
    if (m.type === "SALE" || m.type === "SALE_NONCASH") {
      let method = "Dinheiro";
      const rs = String(m.reason || "");
      const idx = rs.indexOf(" - ");
      if (idx !== -1) method = rs.slice(idx + 3).trim() || method;
      row.methods = row.methods || {};
      row.methods[method] = (row.methods[method] || 0) + val;
    }
  }

  const userIds = Array.from(new Set(sessions.map((s) => s.userId)));
  if (userIds.length) {
    const users = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));
    for (const u of users) {
      for (const s of sessions) if (s.userId === u.id) byId[s.id].userName = u.name ?? "";
    }
  }

  let result = sessions.map((s) => {
    const r = byId[s.id];
    r.expected = Number((r.opening + r.in - r.out).toFixed(2));
    r.difference = Number((r.closing - r.expected).toFixed(2));
    return r;
  });
  if (parsed.paymentMethodName) {
    result = result.filter((r) => (r.methods?.[parsed.paymentMethodName!] ?? 0) > 0);
  }
  return result as const;
}


