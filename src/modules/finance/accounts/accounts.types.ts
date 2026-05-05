import type {z} from "zod";
import { accountTypeEnum } from "../../../db/schema/finance/accounts.js";
import type {
    accountIdParamsSchema,
    createAccountSchema,
    updateAccountSchema
} from "./accounts.schemas.js";

export type AccountType = (typeof accountTypeEnum.enumValues)[number];

export type AccountIdParams = z.infer<typeof accountIdParamsSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export type CreateAccountDbRecord = {
    name: string;
    type: AccountType;
    ownerUserId: string;
    institution: string | null;
    currentBalanceCents: number;
    creditLimitCents: number | null;
    statementClosingDay: number | null;
    paymentDueDay: number | null;
    isActive: boolean;
    notes: string | null;
};

export type UpdateAccountDbRecord = Partial<{
    name: string;
    type: AccountType;
    institution: string | null;
    currentBalanceCents: number;
    creditLimitCents: number | null;
    statementClosingDay: number | null;
    paymentDueDay: number | null;
    isActive: boolean;
    notes: string | null;
}>