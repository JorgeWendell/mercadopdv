"use server";

import { db } from "@/db";
import { productDiscardsTable, productsTable, usersTable, categoriesTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { and, between, eq, ilike } from "drizzle-orm";

interface GetDiscardsParams {
  startDate?: Date;
  endDate?: Date;
  productName?: string;
  reason?: string;
}

export async function getDiscards(params: GetDiscardsParams = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: cookieHeader,
    }),
  });

  if (!session?.user) {
    return { success: false, message: "Não autenticado" };
  }

  try {
    const conditions = [];

    if (params.startDate && params.endDate) {
      conditions.push(
        between(productDiscardsTable.discardedAt, params.startDate, params.endDate)
      );
    }

    if (params.reason) {
      conditions.push(eq(productDiscardsTable.reason, params.reason));
    }

    let query = db
      .select({
        id: productDiscardsTable.id,
        productId: productDiscardsTable.productId,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        batchId: productDiscardsTable.batchId,
        quantity: productDiscardsTable.quantity,
        reason: productDiscardsTable.reason,
        notes: productDiscardsTable.notes,
        discardedBy: productDiscardsTable.discardedBy,
        discardedByName: usersTable.name,
        discardedAt: productDiscardsTable.discardedAt,
        createdAt: productDiscardsTable.createdAt,
      })
      .from(productDiscardsTable)
      .leftJoin(productsTable, eq(productDiscardsTable.productId, productsTable.id))
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(usersTable, eq(productDiscardsTable.discardedBy, usersTable.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let discards = await query;

    if (params.productName) {
      discards = discards.filter((d) =>
        d.productName?.toLowerCase().includes(params.productName!.toLowerCase())
      );
    }

    const mapped = discards.map((d) => ({
      ...d,
      quantity: Number(d.quantity),
      reasonLabel: getReasonLabel(d.reason),
    }));

    const sorted = mapped.sort((a, b) => {
      const dateA = new Date(a.discardedAt).getTime();
      const dateB = new Date(b.discardedAt).getTime();
      return dateB - dateA;
    });

    return { success: true, data: sorted };
  } catch (error) {
    console.error("Erro ao buscar descartes:", error);
    return { success: false, message: "Erro ao buscar descartes" };
  }
}

function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    EXPIRED: "Vencido",
    DAMAGED: "Danificado",
    QUALITY_ISSUE: "Problema de Qualidade",
    OTHER: "Outro",
  };
  return labels[reason] || reason;
}

