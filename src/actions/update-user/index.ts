"use server";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import z from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const schema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().email(),
});

export async function updateUser(input: unknown) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");
  if ((session.user as any).role !== "ADMINISTRATIVO") throw new Error("Acesso negado");

  const data = schema.parse(input);

  await db
    .update(usersTable)
    .set({ name: data.name, email: data.email, updatedAt: new Date() })
    .where(eq(usersTable.id, data.userId));

  return { success: true };
}


