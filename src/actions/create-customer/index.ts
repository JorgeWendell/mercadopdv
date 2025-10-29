"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { customersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { createCustomerSchema } from "./schema";

export async function createCustomer(input: unknown) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const data = createCustomerSchema.parse(input);

  const now = new Date();
  const id = nanoid();

  await db.insert(customersTable).values({
    id,
    name: data.name,
    cpf: data.cpf ?? null,
    cnpj: data.cnpj ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, id };
}
