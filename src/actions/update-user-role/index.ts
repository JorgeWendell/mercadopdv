"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import z from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["NENHUM", "OPERADOR", "ESTOQUE", "COMPRAS", "ADMINISTRATIVO"]),
});

export async function updateUserRole(input: unknown) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");
  const [me] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id))
    .limit(1);
  if ((me?.role as any) !== "ADMINISTRATIVO") throw new Error("Acesso negado");

  const data = schema.parse(input);

  await db
    .update(usersTable)
    .set({ role: data.role, updatedAt: new Date() })
    .where(eq(usersTable.id, data.userId));

  return { success: true };
}


