import type {z} from "zod";
import { reminderModeEnum, reminderStatusEnum } from "../../../db/schema/finance/reminders.js";
import type {
    reminderIdParamsSchema,
    createReminderSchema,
    updateReminderSchema
} from "./reminders.schemas.js";


export type ReminderStatus = (typeof reminderStatusEnum.enumValues)[number];
export type ReminderMode = (typeof reminderModeEnum.enumValues)[number];

export type ReminderIdParams = z.infer<typeof reminderIdParamsSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

export type CreateReminderDbRecord = {
    billId: string | null;
    title: string;
    mode: ReminderMode;
    remindAt: string | null;
    offsetDays: number | null;
    status: ReminderStatus;
    notes: string | null;
    ownerUserId: string;
};

export type UpdateReminderDbRecord = Partial<{
    billId: string | null;
    title: string;
    mode: ReminderMode;
    remindAt: string | null;
    offsetDays: number | null;
    status: ReminderStatus;
    notes: string | null;
}>;

export type ReminderModeState = {
  mode: "absolute" | "bill_offset";
  remindAt: Date | string | null;
  billId: string | null;
  offsetDays: number | null;
};