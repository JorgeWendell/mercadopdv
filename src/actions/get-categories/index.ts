"use server";

import { cookies } from "next/headers";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { categoriesTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getCategories() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");

  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(desc(categoriesTable.createdAt));

  return categories;
}
