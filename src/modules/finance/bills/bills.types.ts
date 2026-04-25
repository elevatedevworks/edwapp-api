import type {z} from "zod";
import { billFrequencyEnum, billStatusEnum } from "../../../db/schema/finance/bills.js";
import type {
    billIdParamsSchema,
    createBillSchema,
    updateBillSchema
} from "./bills.schemas.js";

export type BillFrequency = (typeof billFrequencyEnum.enumValues)[number];
export type BillStatus = (typeof billStatusEnum.enumValues)[number];

export type BillIdParams = z.infer<typeof billIdParamsSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export type CreateBillDbRecord = {
    name: string;
    vendor: string | null;
    accountId: string | null;
    amountDueCents: number;
    dueDate: string | null;
    dueDayOfMonth: number | null;
    frequency: BillFrequency;
    status: BillStatus;
    autopay: boolean;
    notes: string | null;
    isActive: boolean;
    ownerUserId: string;
}

export type UpdateBillDbRecord = Partial<{
    name: string;
    vendor: string | null;
    accountId: string | null;
    amountDueCents: number;
    dueDate: string | null;
    dueDayOfMonth: number | null;
    frequency: BillFrequency;
    status: BillStatus;
    autopay: boolean;
    notes: string | null;
    isActive: boolean;
}>