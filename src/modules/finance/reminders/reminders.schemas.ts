import {z} from "zod";

export const reminderIdParamsSchema = z.object({
    id: z.uuid()
});

export const createReminderSchema = z.object(
    {
        billId: z.uuid().optional().nullable(),
        title: z.string().trim().min(1, "Title is required").max(255),
        mode: z.enum(["absolute", "bill_offset"]).default("absolute"),
        remindAt: z.iso.datetime().optional().nullable(),
        offsetDays: z.number().int().optional().nullable(),
        status: z.enum(["pending", "sent", "dismissed"]).optional(),
        notes: z.string().trim().optional().nullable(),
    }
)

export const updateReminderSchema = createReminderSchema.partial().refine(
    data => Object.keys(data).length > 0,
    {
        message: "At least one field must be provided for update"
    }
)