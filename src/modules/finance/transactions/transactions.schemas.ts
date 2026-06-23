import { z } from "zod";

export const transactionIdParamsSchema = z.object({
	id: z.uuid(),
});

export const createTransactionSchema = z.object({
	kind: z.enum([
		"expense",
		"income",
		"transfer",
		"adjustment",
		"credit_card_purchase",
	]),
	accountId: z.uuid(),
	counterpartyAccountId: z.uuid().optional().nullable(),
	linkedBillId: z.uuid().optional().nullable(),
	amountCents: z.number().int().positive("Amount must be greater than zero"),
	transactionDate: z.iso.date(),
	description: z.string().trim().min(1, "Description is required").max(255),
	notes: z.string().trim().optional().nullable(),
	linkedBillInstanceId: z.uuid().optional(),
});
