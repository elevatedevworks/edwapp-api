import type {z} from "zod";
import {billInstanceStatusEnum} from "../../../db/schema/finance/bill-instances.js";
import type {
    billInstanceParamsSchema,
    createBillInstanceSchema,
    updateBillInstanceSchema
}   from "./bill-instances.schemas.js";

export type BillInstanceStatus = (typeof billInstanceStatusEnum.enumValues)[number];

export type BillInstanceParams = z.infer<typeof billInstanceParamsSchema>;
export type CreateBillInstanceInput = z.infer<typeof createBillInstanceSchema>;
export type UpdateBillInstanceInput = z.infer<typeof updateBillInstanceSchema>;

export type CreateBillInstanceDbRecord = {
    ownerUserId: string;
    billId: string;
    periodYear: number;
    periodMonth: number;
    dueDate: string;
    amountDueCents: number;
    amountPaidCents: number;
    status: BillInstanceStatus;
    notes: string | null;
}

export type UpdateBillInstanceDbRecord = Partial<{
  billId: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  amountDueCents: number;
  amountPaidCents: number;
  status: BillInstanceStatus;
  notes: string | null;
}>;