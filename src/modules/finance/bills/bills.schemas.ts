import {z} from "zod";

export const billIdParamsSchema = z.object({
    id: z.uuid()
})

export const createBillSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(255),
    vendor: z.string().trim().max(255).optional().nullable(),
    accountId: z.uuid().optional().nullable(),
    amountDueCents: z.number().int(),
    dueDate: z.iso.date().optional().nullable(),
    dueDayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
    frequency: z.enum(["one_time", "weekly", "monthly", "quarterly", "annual"]),
    status: z.enum(["active", "paused", "paid", "archived"]).optional(),
    autopay: z.boolean().optional(),
    notes: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional()
})

export const updateBillSchema = createBillSchema.partial().refine(
    data => Object.keys(data).length > 0,
    {
        message: "At least one field must be provided for update"
    }
)
