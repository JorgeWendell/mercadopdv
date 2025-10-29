"use server";

import { cookies } from "next/headers";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { customersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getCustomers() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const customers = await db
    .select()
    .from(customersTable)
    .orderBy(desc(customersTable.createdAt));

  return customers;
}
