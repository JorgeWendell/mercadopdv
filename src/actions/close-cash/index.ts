"use server";

import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { cashSessionsTable } from "@/db/schema";
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
      .select({ id: cashSessionsTable.id })
      .from(cashSessionsTable)
      .where(and(eq(cashSessionsTable.userId, session.user.id), isNull(cashSessionsTable.closedAt)))
      .limit(1);

    if (!open) throw new Error("Nenhum caixa aberto");

    await db
      .update(cashSessionsTable)
      .set({
        closedAt: new Date(),
        closingAmount: String(parsed.data.closingAmount.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(cashSessionsTable.id, open.id));

    return { id: open.id };
  } catch (e: any) {
    console.error("closeCash error:", e);
    throw new Error(e?.message ?? "Erro ao fechar caixa");
  }
}


