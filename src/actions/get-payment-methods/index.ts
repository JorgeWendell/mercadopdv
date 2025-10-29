"use server";

import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentMethodsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getPaymentMethods() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const paymentMethods = await db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.active, true))
    .orderBy(desc(paymentMethodsTable.createdAt));

  return paymentMethods;
}

