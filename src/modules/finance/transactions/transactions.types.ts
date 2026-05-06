import type { z } from "zod";
import { transactionKindEnum } from "../../../db/schema/finance/transactions.js";
import type {
  createTransactionSchema,
  transactionIdParamsSchema,
} from "./transactions.schemas.js";

export type TransactionKind = (typeof transactionKindEnum.enumValues)[number];

export type TransactionIdParams = z.infer<typeof transactionIdParamsSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export type CreateTransactionDbRecord = {
  ownerUserId: string;
  kind: TransactionKind;
  accountId: string;
  counterpartyAccountId: string | null;
  linkedBillId: string | null;
  amountCents: number;
  transactionDate: string;
  description: string;
  notes: string | null;
};