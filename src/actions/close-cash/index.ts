"use server";

import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { cashMovementsTable, cashSessionsTable, paymentMethodsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { closeCashSchema, type CloseCashInput } from "./schema";

export async function closeCash(input: CloseCashInput) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
    if (!session?.user) throw new Error("Não autenticado");

    const parsed = closeCashSchema.safeParse(input);
    if (!parsed.success) throw new Error("Dados inválidos");

    const [open] = await db
      .select({ id: cashSessionsTable.id, openingAmount: cashSessionsTable.openingAmount })
      .from(cashSessionsTable)
      .where(and(eq(cashSessionsTable.userId, session.user.id), isNull(cashSessionsTable.closedAt)))
      .limit(1);

    if (!open) throw new Error("Nenhum caixa aberto");

    // calcular esperado em dinheiro: abertura + IN - OUT + SALE - REFUND
    const movements = await db
      .select({ type: cashMovementsTable.type, amount: cashMovementsTable.amount })
      .from(cashMovementsTable)
      .where(eq(cashMovementsTable.sessionId, open.id));
    const opening = parseFloat(String(open.openingAmount)) || 0;
    const sumIn = movements.filter((m) => m.type === "IN" || m.type === "SALE").reduce((a, m) => a + (parseFloat(String(m.amount)) || 0), 0);
    const sumOut = movements.filter((m) => m.type === "OUT" || m.type === "REFUND").reduce((a, m) => a + (parseFloat(String(m.amount)) || 0), 0);
    const expectedCash = opening + sumIn - sumOut;

    const [cashMethod] = await db
      .select({ id: paymentMethodsTable.id, name: paymentMethodsTable.name })
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.name, "Dinheiro"))
      .limit(1);
    const countedCash = parsed.data.counts?.find((c) => c.paymentMethodId === cashMethod?.id)?.amount ?? 0;
    const diff = Number((countedCash - expectedCash).toFixed(2));
    if (diff !== 0 && !parsed.data.justification) {
      throw new Error("Informe uma justificativa para a diferença no fechamento");
    }

    await db
      .update(cashSessionsTable)
      .set({
        closedAt: new Date(),
        closingAmount: String(countedCash.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(cashSessionsTable.id, open.id));

    return { id: open.id };
  } catch (e: any) {
    console.error("closeCash error:", e);
    throw new Error(e?.message ?? "Erro ao fechar caixa");
  }
}


