"use server";

import { cookies } from "next/headers";
import { and, desc, gte, lte, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { cashMovementsTable, cashSessionsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const inputSchema = z
  .object({ start: z.date().optional(), end: z.date().optional() })
  .optional();

export async function getCashStatus(input?: { start?: Date; end?: Date }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
  if (!session?.user) throw new Error("Não autenticado");
  const parsed = inputSchema.parse(input);

  const [open] = await db
    .select({
      id: cashSessionsTable.id,
      openedAt: cashSessionsTable.openedAt,
      openingAmount: cashSessionsTable.openingAmount,
    })
    .from(cashSessionsTable)
    .where(and(eq(cashSessionsTable.userId, session.user.id), isNull(cashSessionsTable.closedAt)))
    .limit(1);

  if (!open) return { isOpen: false } as const;

  const q = db
    .select({
      id: cashMovementsTable.id,
      type: cashMovementsTable.type,
      amount: cashMovementsTable.amount,
      reason: cashMovementsTable.reason,
      createdAt: cashMovementsTable.createdAt,
    })
    .from(cashMovementsTable)
    .where(eq(cashMovementsTable.sessionId, open.id));

  const filters = [] as any[];
  if (parsed?.start) filters.push(gte(cashMovementsTable.createdAt, parsed.start));
  if (parsed?.end) filters.push(lte(cashMovementsTable.createdAt, parsed.end));
  const movements = await (filters.length > 0 ? q.where(and(eq(cashMovementsTable.sessionId, open.id), ...filters)) : q).orderBy(
    desc(cashMovementsTable.createdAt)
  );

  const opening = parseFloat(String(open.openingAmount)) || 0;
  const sumIn = movements
    .filter((m) => m.type === "IN" || m.type === "SALE")
    .reduce((acc, m) => acc + (parseFloat(String(m.amount)) || 0), 0);
  const sumOut = movements
    .filter((m) => m.type === "OUT" || m.type === "REFUND")
    .reduce((acc, m) => acc + (parseFloat(String(m.amount)) || 0), 0);
  const balance = opening + sumIn - sumOut;

  return {
    isOpen: true,
    session: open,
    movements,
    totals: { opening, in: sumIn, out: sumOut, balance },
  } as const;
}


