"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { inventorySessionsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { inventoryStartSchema, type InventoryStartInput } from "./schema";

export async function inventoryStart(input: InventoryStartInput) {
  const parsed = inventoryStartSchema.parse(input);
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
  if (!session?.user) throw new Error("Não autenticado");

  const id = nanoid();
  const now = new Date();
  await db.insert(inventorySessionsTable).values({
    id,
    name: parsed.name,
    notes: parsed.notes,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: session.user.id,
  });
  return { id };
}


