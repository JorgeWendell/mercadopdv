import { z } from "zod";

export const cashCountSchema = z.object({
  paymentMethodId: z.string().min(1),
  amount: z.coerce.number().min(0),
});

export const closeCashSchema = z.object({
  counts: z.array(cashCountSchema).default([]),
  justification: z.string().trim().optional(),
});

export type CloseCashInput = z.infer<typeof closeCashSchema>;


