import {z} from "zod";

export const billInstanceParamsSchema = z.object({
    id: z.uuid()
});

export const createBillInstanceSchema = z.object({
    billId: z.uuid(),
    periodYear: z.number().int().min(2000).max(2100),
    periodMonth: z.number().int().min(1).max(12),
    dueDate: z.iso.date(),
    amountDueCents: z.number().int(),
    amountPaidCents: z.number().int().min(0).optional(),
    notes: z.string().trim().optional().nullable()
})

export const updateBillInstanceSchema = createBillInstanceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  }
);