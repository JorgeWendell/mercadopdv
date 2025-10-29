"use server";

import { cookies } from "next/headers";

import { db } from "@/db";
import { suppliersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function getSuppliers() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const suppliers = await db
    .select()
    .from(suppliersTable)
    .orderBy(desc(suppliersTable.createdAt));

  return suppliers;
}

