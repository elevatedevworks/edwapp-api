import {z} from "zod";

export const paymentIdParamsSchema = z.object({
    id: z.uuid()
});

export const createPaymentSchema = z.object({
    accountId: z.uuid(),
    billId: z.uuid().optional().nullable(),
    amountCents: z.number().int().positive("Amount must be greater than zero"),
    paymentDate: z.iso.date(),
    direction: z.enum(["outflow", "inflow"]),
    method: z.enum(["bank_transfer", "card", "cash", "check", "autopay", "other"]),
    reference: z.string().trim().max(255).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
})

export const updatePaymentSchema = createPaymentSchema.partial().refine(
    data => Object.keys(data).length > 0,
    {
        message: "At least one field must be provided for update"
    }
)