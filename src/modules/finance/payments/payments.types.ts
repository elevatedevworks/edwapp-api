import type {z} from "zod";
import { paymentDirectionEnum, paymentMethodEnum } from "../../../db/schema/finance/payments.js";
import { createPaymentSchema, paymentIdParamsSchema, updatePaymentSchema } from "./payments.schemas.js";


export type PaymentDirection = (typeof paymentDirectionEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
    
export type CreatePaymentDbRecord = {
        ownerUserId: string;
        accountId: string;
        billId: string | null;
        amountCents: number;
        paymentDate: string;
        direction: PaymentDirection;
        method: PaymentMethod;
        reference: string | null;
        notes: string | null;
}

export type UpdatePaymentDbRecord = Partial<{
        accountId: string;
        billId: string | null;
        amountCents: number;
        paymentDate: string;
        direction: PaymentDirection;
        method: PaymentMethod;
        reference: string | null;
        notes: string | null;
}>