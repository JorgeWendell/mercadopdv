"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { paymentMethodsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

const defaultPaymentMethods = [
  "Dinheiro",
  "Crédito",
  "Débito",
  "Pix",
  "VA",
  "VR",
];

export async function seedPaymentMethods() {
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

  for (const methodName of defaultPaymentMethods) {
    const existing = await db
      .select()
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.name, methodName))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(paymentMethodsTable).values({
        id: nanoid(),
        name: methodName,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return { success: true };
}

