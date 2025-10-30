"use server";

import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { cashMovementsTable, cashSessionsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createCashMovementSchema, type CreateCashMovementInput } from "./schema";

export async function createCashMovement(input: CreateCashMovementInput) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
    if (!session?.user) throw new Error("Não autenticado");

    const parsed = createCashMovementSchema.safeParse(input);
    if (!parsed.success) throw new Error("Dados inválidos");

    const [open] = await db
      .select({ id: cashSessionsTable.id })
      .from(cashSessionsTable)
      .where(and(eq(cashSessionsTable.userId, session.user.id), isNull(cashSessionsTable.closedAt)))
      .limit(1);
    if (!open) throw new Error("Nenhum caixa aberto");

    const id = nanoid();
    await db.insert(cashMovementsTable).values({
      id,
      sessionId: open.id,
      type: parsed.data.type,
      amount: String(parsed.data.amount.toFixed(2)),
      reason: parsed.data.reason,
      createdAt: new Date(),
      userId: session.user.id,
    });

    return { id };
  } catch (e: any) {
    console.error("createCashMovement error:", e);
    throw new Error(e?.message ?? "Erro ao movimentar caixa");
  }
}


