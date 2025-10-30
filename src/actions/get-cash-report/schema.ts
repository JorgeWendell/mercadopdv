import { z } from "zod";

export const cashReportSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
  operatorId: z.string().optional(),
  paymentMethodName: z.string().optional(),
});

export type CashReportInput = z.infer<typeof cashReportSchema>;


