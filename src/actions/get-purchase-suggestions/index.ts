"use server";

import { db } from "@/db";
import { productsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getPurchaseSuggestionsSchema } from "./schema";

export async function getPurchaseSuggestions(input: unknown) {
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

  const validated = getPurchaseSuggestionsSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, message: "Dados inválidos" };
  }

  const { categoryId, supplierId } = validated.data;

  try {
    const allProductsRaw = await db
      .select()
      .from(productsTable);

    let allProducts = allProductsRaw.filter((p) => p.active === true);

    if (categoryId) {
      allProducts = allProducts.filter((p) => p.categoryId === categoryId);
    }

    if (supplierId) {
      allProducts = allProducts.filter((p) => p.supplierId === supplierId);
    }

    const suggestions = allProducts.filter((p) => {
      const stock = Number(p.stock || 0);
      const minStock = Number(p.minStock || 0);
      return minStock > 0 && stock < minStock;
    });

    const mapped = suggestions.map((p) => {
      const stock = Number(p.stock);
      const minStock = Number(p.minStock) || 10;
      const maxStock = Number(p.maxStock) || minStock * 2;
      const suggestedQty = Math.ceil(maxStock - stock);

      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        stock,
        minStock,
        maxStock,
        costPrice: Number(p.costPrice),
        categoryId: p.categoryId,
        supplierId: p.supplierId,
        suggestedQty: suggestedQty > 0 ? suggestedQty : minStock,
      };
    });

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Erro ao buscar sugestões:", error);
    return { success: false, message: "Erro ao buscar sugestões" };
  }
}

