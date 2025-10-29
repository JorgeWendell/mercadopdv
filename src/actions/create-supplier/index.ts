"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { suppliersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { createSupplierSchema } from "./schema";

export async function createSupplier(input: unknown) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const data = createSupplierSchema.parse(input);

  const now = new Date();
  const id = nanoid();

  await db.insert(suppliersTable).values({
    id,
    name: data.name,
    cnpj: data.cnpj ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, id };
}
