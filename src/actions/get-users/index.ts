"use server";

import { cookies } from "next/headers";
import { and, desc, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface GetUsersResponseItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface GetUsersParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface GetUsersResponse {
  items: GetUsersResponseItem[];
  total: number;
}

export async function getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session?.user) throw new Error("Não autenticado");
  // Checa papel no banco (payload da sessão pode não conter role)
  const [me] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id))
    .limit(1);
  if ((me?.role as any) !== "ADMINISTRATIVO") throw new Error("Acesso negado");

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? 12);
  const offset = (page - 1) * pageSize;

  const where = params?.q
    ? or(
        sql`lower(${usersTable.name}) like ${"%" + params.q.toLowerCase() + "%"}`,
        sql`lower(${usersTable.email}) like ${"%" + params.q.toLowerCase() + "%"}`,
      )
    : undefined;

  const totalRows = where
    ? await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(where)
    : await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const total = Number(totalRows[0]?.count ?? 0);

  const users = where
    ? await db.select().from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(pageSize).offset(offset)
    : await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(pageSize).offset(offset);

  const items = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u as any).role ?? "OPERADOR",
    createdAt: u.createdAt,
  }));

  return { items, total };
}


