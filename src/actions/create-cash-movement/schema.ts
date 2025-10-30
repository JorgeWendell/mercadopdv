import { z } from "zod";

export const createCashMovementSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(1).optional(),
});

export type CreateCashMovementInput = z.infer<typeof createCashMovementSchema>;


