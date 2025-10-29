import z from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1),
  supplierId: z.string().optional(),
  unit: z.string().min(1),
  purchasePrice: z.number().positive(),
  salePrice: z.number().positive(),
  profitMargin: z.number().optional(),
  stock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  maxStock: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  active: z.boolean().optional(),
});
