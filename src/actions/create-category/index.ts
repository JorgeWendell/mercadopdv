"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { categoriesTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { createCategorySchema } from "./schema";

export async function createCategory(input: unknown) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const data = createCategorySchema.parse(input);

  const now = new Date();
  const id = nanoid();

  await db.insert(categoriesTable).values({
    id,
    name: data.name,
    description: data.description ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, id };
}
