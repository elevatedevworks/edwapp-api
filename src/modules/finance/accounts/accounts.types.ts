import type {z} from "zod";
import { accountTypeEnum } from "../../../db/schema/finance/accounts.js";
import type {
    accountIdParamsSchema,
    createAccountSchema,
    updateAccountSchema
} from "./accounts.schema.js";

export type AccountType = (typeof accountTypeEnum.enumValues)[number];

export type AccountIdParams = z.infer<typeof accountIdParamsSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export type CreateAcountDbRecord = {
    name: string;
    type: AccountType;
    ownerUserId: string;
    institution: string | null;
    currentBalanceCents: number;
    isActive: boolean;
    notes: string | null;
};

export type UpdateAccountDbRecord = Partial<{
    name: string;
    type: AccountType;
    institution: string | null;
    currentBalanceCents: number;
    isActive: boolean;
    notes: string | null;
}>