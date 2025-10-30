"use server";

import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";

import { db } from "@/db";
import { cashSessionsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { type OpenCashInput,openCashSchema } from "./schema";

export async function openCash(input: OpenCashInput) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
    if (!session?.user) throw new Error("Não autenticado");

    const parsed = openCashSchema.safeParse(input);
    if (!parsed.success) throw new Error("Dados inválidos");

    const existing = await db
      .select({ id: cashSessionsTable.id })
      .from(cashSessionsTable)
      .where(and(eq(cashSessionsTable.userId, session.user.id), isNull(cashSessionsTable.closedAt)));

    if (existing.length > 0) throw new Error("Já existe um caixa aberto");

    const id = nanoid();
    await db.insert(cashSessionsTable).values({
      id,
      userId: session.user.id,
      openedAt: new Date(),
      openingAmount: String(parsed.data.openingAmount.toFixed(2)),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { id };
  } catch (e) {
    console.error("openCash error:", e);
    const message = e instanceof Error ? e.message : "Erro ao abrir caixa";
    throw new Error(message);
  }
}


